import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from backend import macos
from backend.pipeline import write_status

class MacTests(unittest.TestCase):
    def test_unavailable_object_capture_never_creates_model(self):
        with tempfile.TemporaryDirectory() as folder:
            base=Path(folder);write_status(base,status='queued')
            with patch('backend.macos.requirements',return_value={'ready':False,'missing':['Metal indisponível']}):
                macos.run_job(base)
            job=json.loads((base/'job.json').read_text())
            self.assertEqual(job['status'],'failed');self.assertIn('Metal',job['error'])
            self.assertFalse((base/'result'/'head.usdz').exists())
    def test_non_macos_reports_requirement(self):
        with patch('backend.macos.platform.system',return_value='Linux'):
            result=macos.requirements()
        self.assertFalse(result['ready']);self.assertEqual(result['pipeline'],'apple-object-capture')
    def test_failed_native_process_preserves_error(self):
        class Process:
            stdout=iter(['{"event":"progress","fraction":0.4}\n','{"event":"error","message":"Não foi possível alinhar imagens."}\n'])
            def wait(self):return 1
            def poll(self):return 1
        with tempfile.TemporaryDirectory() as folder:
            base=Path(folder);write_status(base,status='queued')
            with patch('backend.macos.requirements',return_value={'ready':True}),patch('backend.macos.subprocess.Popen',return_value=Process()):
                macos.run_job(base)
            job=json.loads((base/'job.json').read_text())
            self.assertEqual(job['status'],'failed');self.assertEqual(job['progress'],.4)
            self.assertIn('alinhar',job['error']);self.assertFalse((base/'result'/'head.usdz').exists())
