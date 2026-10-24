import os
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

_storage=tempfile.TemporaryDirectory()
os.environ['IMERSITY_API_TOKEN']='test-only-token-not-for-deployment'
os.environ['IMERSITY_DATA_DIR']=_storage.name
from fastapi.testclient import TestClient
from backend.app import app
from backend import app as service

class APITests(unittest.TestCase):
    def setUp(self):self.client=TestClient(app)
    def test_requests_require_token(self):
        self.assertEqual(self.client.get('/health').status_code,401)
    def test_health_reports_actual_missing_requirements(self):
        with patch('backend.app.requirements',return_value={'ready':False,'missing':['GPU']}):
            response=self.client.get('/health',headers={'Authorization':'Bearer test-only-token-not-for-deployment'})
        self.assertEqual(response.status_code,200);self.assertFalse(response.json()['ready'])
    def test_job_rejected_without_gpu(self):
        with patch('backend.app.requirements',return_value={'ready':False,'missing':['GPU']}):
            response=self.client.post('/jobs',headers={'Authorization':'Bearer test-only-token-not-for-deployment'},files={'capture':('capture.zip',b'not-a-zip','application/zip')})
        self.assertEqual(response.status_code,503)
    def test_cors_preflight_for_local_viewer(self):
        response=self.client.options('/health',headers={'Origin':'http://127.0.0.1:5173','Access-Control-Request-Method':'GET','Access-Control-Request-Headers':'authorization'})
        self.assertEqual(response.status_code,200);self.assertEqual(response.headers['access-control-allow-origin'],'http://127.0.0.1:5173')
    def test_local_session_rejects_foreign_host_and_cross_site(self):
        with patch('backend.app.LOCAL',True):
            self.assertEqual(self.client.get('/local-session').status_code,403)
            self.assertEqual(self.client.get('/local-session',headers={'host':'127.0.0.1:4180','sec-fetch-site':'cross-site'}).status_code,403)
            self.assertEqual(self.client.get('/local-session',headers={'host':'127.0.0.1:4180','Origin':'https://example.org'}).status_code,403)
            response=self.client.get('/local-session',headers={'host':'127.0.0.1:4180','sec-fetch-site':'same-origin'})
            self.assertEqual(response.status_code,200);self.assertEqual(response.headers['cache-control'],'no-store')
            self.assertEqual(self.client.get('/health',headers={'host':'127.0.0.1:4180'}).status_code,401)
    def test_unknown_id_never_serves_arbitrary_path(self):
        response=self.client.get('/jobs/invalid/result',headers={'Authorization':'Bearer test-only-token-not-for-deployment'})
        self.assertEqual(response.status_code,404)
    def test_repeat_preserves_input_bytes_and_forwards_crop(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);source=root/('a'*32);train=source/'capture'/'train';train.mkdir(parents=True)
            original=b'unchanged prepared image bytes';(train/'frame_00000.jpg').write_bytes(original)
            (source/'capture'/'capture.json').write_text(json.dumps({'images':[{'role':'train','width':2160,'height':3840,'sourceVideo':'test.mov'}]}))
            (source/'job.json').write_text(json.dumps({'id':source.name,'status':'completed','counts':{'train':80,'evaluation':0}}))
            with patch.object(service,'ROOT',root),patch.object(service,'ENGINE','apple-object-capture'),patch.object(service,'requirements',return_value={'ready':True}),patch.object(service.pool,'submit') as submit:
                headers={'Authorization':'Bearer test-only-token-not-for-deployment'}
                response=self.client.post(f'/jobs/{source.name}/repeat?detail=head-custom&base_cut=0.25',headers=headers)
                self.assertEqual(response.status_code,202)
                destination=root/response.json()['id']
                self.assertEqual((destination/'capture'/'train'/'frame_00000.jpg').read_bytes(),original)
                self.assertEqual((train/'frame_00000.jpg').read_bytes(),original)
                saved=json.loads((destination/'job.json').read_text())
                self.assertEqual(saved['sourceJob'],source.name);self.assertEqual(saved['baseCut'],.25)
                submit.assert_called_once_with(service.macos.run_job,destination,'head-custom',.25)
                listing=self.client.get('/jobs',headers=headers).json()
                self.assertEqual(listing[0]['width'],2160)
                self.assertEqual(self.client.get('/jobs').status_code,401)
    def test_invalid_geometry_options_are_rejected_before_upload(self):
        headers={'Authorization':'Bearer test-only-token-not-for-deployment'}
        for query in ('detail=head-custom&base_cut=0.8','detail=head-custom&base_cut=nan','detail=full&base_cut=0.2','detail=unknown'):
            response=self.client.post('/jobs?'+query,headers=headers,files={'capture':('capture.zip',b'invalid','application/zip')})
            self.assertEqual(response.status_code,400)
    def test_mixed_saved_capture_is_flagged_and_cannot_be_repeated(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);source=root/('b'*32);capture=source/'capture';capture.mkdir(parents=True)
            (capture/'capture.json').write_text(json.dumps({'images':[
                {'role':'train','sourceVideo':'first.mov'},
                {'role':'train','sourceVideo':'second.mov'},
            ]}))
            (source/'job.json').write_text(json.dumps({'status':'completed','counts':{'train':160}}))
            headers={'Authorization':'Bearer test-only-token-not-for-deployment'}
            with patch.object(service,'ROOT',root),patch.object(service.pool,'submit') as submit:
                self.assertTrue(self.client.get('/jobs',headers=headers).json()[0]['mixedSources'])
                response=self.client.post(f'/jobs/{source.name}/repeat',headers=headers)
                self.assertEqual(response.status_code,400)
                submit.assert_not_called()
                self.assertEqual(len(list(root.iterdir())),1)
if __name__=='__main__':unittest.main()
