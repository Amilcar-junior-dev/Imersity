"""Minimal self-contained glTF 2 writer for the local head experiment."""
import json,struct
import numpy as np

class GLB:
    def __init__(self):
        self.binary=bytearray();self.document={'asset':{'version':'2.0','generator':'Imersity assisted head preparation'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[],'meshes':[],'materials':[],'bufferViews':[],'accessors':[],'buffers':[],'extensionsUsed':['KHR_materials_unlit']}
    def blob(self,data,target=None):
        while len(self.binary)%4:self.binary.append(0)
        offset=len(self.binary);self.binary.extend(data)
        view={'buffer':0,'byteOffset':offset,'byteLength':len(data)}
        if target:view['target']=target
        self.document['bufferViews'].append(view);return len(self.document['bufferViews'])-1
    def accessor(self,values,kind):
        values=np.asarray(values,dtype='<f4' if kind!='INDICES' else '<u4')
        type_name={1:'SCALAR',2:'VEC2',3:'VEC3'}[1 if values.ndim==1 else values.shape[1]]
        index=self.blob(values.tobytes(),34963 if kind=='INDICES' else 34962)
        data={'bufferView':index,'componentType':5125 if kind=='INDICES' else 5126,'count':len(values),'type':type_name}
        if kind=='POSITION':data.update(min=values.min(axis=0).astype(float).tolist(),max=values.max(axis=0).astype(float).tolist())
        self.document['accessors'].append(data);return len(self.document['accessors'])-1
    def mesh(self,name,points,normals,material,uvs=None,faces=None,metadata=None):
        primitive={'attributes':{'POSITION':self.accessor(points,'POSITION'),'NORMAL':self.accessor(normals,'NORMAL')},'material':material,'mode':4}
        if uvs is not None:primitive['attributes']['TEXCOORD_0']=self.accessor(uvs,'TEXCOORD')
        if faces is not None:primitive['indices']=self.accessor(np.asarray(faces).reshape(-1),'INDICES')
        mesh=len(self.document['meshes']);self.document['meshes'].append({'name':name,'primitives':[primitive]})
        node=len(self.document['nodes']);self.document['nodes'].append({'name':name,'mesh':mesh,'extras':{'imersity':metadata or {}}});return node
    def write(self,path):
        while len(self.binary)%4:self.binary.append(0)
        self.document['buffers']=[{'byteLength':len(self.binary)}]
        meta=json.dumps(self.document,separators=(',',':'),ensure_ascii=True).encode()
        meta+=b' '*((-len(meta))%4)
        data=struct.pack('<III',0x46546c67,2,12+8+len(meta)+8+len(self.binary))+struct.pack('<II',len(meta),0x4e4f534a)+meta+struct.pack('<II',len(self.binary),0x004e4942)+self.binary
        path.write_bytes(data)

def linear_hex(value):
    c=np.array([int(value[i:i+2],16)/255 for i in (0,2,4)])
    return np.where(c<=.04045,c/12.92,((c+.055)/1.055)**2.4).tolist()+[1.]
