"""Reconstruction provenance with synthetic captures, without GPU execution."""
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'scripts'))
import reconstruct_saved as runner


class SavedReconstructionTests(unittest.TestCase):
    def source(self, root, mixed=False):
        source=root/'data'/('a'*32)
        (source/'capture/train').mkdir(parents=True)
        (source/'capture/train/frame_00000.jpg').write_bytes(b'original bytes')
        images=[{'role':'train','sourceVideo':'one.mov'}]
        if mixed:images.append({'role':'train','sourceVideo':'two.mov'})
        (source/'capture/capture.json').write_text(json.dumps({'images':images}))
        (source/'job.json').write_text(json.dumps({'status':'completed'}))
        return source

    def test_copy_preserved_and_profile_forwarded(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);source=self.source(root);before=runner.hashes(source)
            def execute(destination, profile):
                self.assertEqual(profile, 'recovery')
                self.assertEqual(runner.hashes(destination/'capture'),runner.hashes(source/'capture'))
                runner.write_status(destination,status='completed')
            with patch.object(runner,'ROOT',root),patch.object(runner.macos,'run_job',side_effect=execute):
                self.assertTrue(runner.repeat(source.name,'recovery'))
            self.assertEqual(runner.hashes(source),before)
            new=next(p for p in (root/'data').iterdir() if p!=source)
            job=json.loads((new/'job.json').read_text())
            self.assertTrue(job['inputBytesVerified'])
            self.assertTrue(job['sourceCaptureUnchanged'])
            self.assertEqual(job['sourceJob'],source.name)
            self.assertEqual(job['counts'],{'train':1,'evaluation':0})

    def test_mixed_source_stops_before_new_job(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);source=self.source(root,mixed=True)
            with patch.object(runner,'ROOT',root),patch.object(runner.macos,'run_job') as execute:
                with self.assertRaises(ValueError):runner.repeat(source.name,'recovery')
                execute.assert_not_called()
            self.assertEqual(len(list((root/'data').iterdir())),1)


if __name__=='__main__':unittest.main()
