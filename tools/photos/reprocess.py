import json,os,glob
from PIL import Image
mf=json.load(open('manifest.json'))
# crop params recorded nowhere; only reprocess items whose size exceeds limit, using default center crop except known overrides
OVR={('venue','rome-colosseum'):(0.95,0.5),('venue','rome-forum'):(0.45,0.5),('venue','gr-acropolis'):(0.55,0.5),('venue','nash-showboat'):(0.4,0.5),('hotel','nash-courtyard-downtown'):(0.5,0.0),('hotel','ldn-sheraton-pl'):(0.5,0.4)}
for kind in ('dest','venue','hotel'):
    lim=90000 if kind=='dest' else 30000
    floor=30 if kind=='dest' else 32
    for id,v in mf[kind].items():
        if os.path.getsize(v['file'])<=lim: continue
        raw=f'raw/{kind}_{id}.jpg'
        im=Image.open(raw).convert('RGB'); crop=OVR.get((kind,id),(0.5,0.5))
        tw,th=(16,9) if kind=='dest' else (4,3); W,H=im.size
        if W/H>tw/th: nw=int(H*tw/th); x=int((W-nw)*crop[0]); box=(x,0,x+nw,H)
        else: nh=int(W*th/tw); y=int((H-nh)*crop[1]); box=(0,y,W,y+nh)
        im=im.crop(box).resize((1280,720) if kind=='dest' else (480,360),Image.LANCZOS)
        q=44 if kind=='dest' else 46
        while True:
            im.save(v['file'],'WEBP',quality=q,method=6)
            if os.path.getsize(v['file'])<=lim or q<=floor: break
            q-=3
        print(kind,id,q,os.path.getsize(v['file']))
