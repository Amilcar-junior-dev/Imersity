import io
import json
from pathlib import Path
import tempfile
import unittest
import zipfile
from PIL import Image
from backend.pipeline import unpack_capture, commands, run_job, write_status
from unittest.mock import patch

class PipelineTests(unittest.TestCase):
    def image(self):
        out=io.BytesIO(); Image.new('RGB',(128,128),(180,150,130)).save(out,format='JPEG'); return out.getvalue()
    def bundle(self,path,extra=None,roles=('train','evaluation')):
        manifest={'schema':'imersity.capture.v1','images':[{'path':f'images/{i}.jpg','role':role} for i,role in enumerate(roles)]}
        with zipfile.ZipFile(path,'w') as z:
            z.writestr('capture.json',json.dumps(manifest))
            for i in range(len(roles)):z.writestr(f'images/{i}.jpg',self.image())
            if extra:z.writestr(extra,'bad')
    def test_evaluation_never_enters_training_directory(self):
        with tempfile.TemporaryDirectory() as d:
            base=Path(d); self.bundle(base/'capture.zip'); counts=unpack_capture(base/'capture.zip',base/'capture',minimum_training=1)
            self.assertEqual(counts,{'train':1,'evaluation':1});self.assertEqual(len(list((base/'capture'/'train').glob('*.jpg'))),1)
            command=commands(base)[0];self.assertIn(str(base/'capture'/'train'),command);self.assertNotIn(str(base/'capture'/'evaluation'),command)
    def test_zip_traversal_is_rejected_without_writing_outside(self):
        with tempfile.TemporaryDirectory() as d:
            base=Path(d); self.bundle(base/'capture.zip',extra='../escape')
            with self.assertRaisesRegex(ValueError,'Caminho'):unpack_capture(base/'capture.zip',base/'capture',minimum_training=1)
            self.assertFalse((base.parent/'escape').exists())
    def test_insufficient_training_images_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            base=Path(d);self.bundle(base/'capture.zip')
            with self.assertRaisesRegex(ValueError,'20'):unpack_capture(base/'capture.zip',base/'capture')
    def test_missing_gpu_reports_failure_and_never_fakes_result(self):
        with tempfile.TemporaryDirectory() as d:
            base=Path(d);write_status(base,id='test',status='queued')
            with patch('backend.pipeline.requirements',return_value={'ready':False,'missing':['GPU']}):run_job(base)
            result=json.loads((base/'job.json').read_text());self.assertEqual(result['status'],'failed');self.assertFalse((base/'result'/'splat.ply').exists())
if __name__=='__main__':unittest.main()
