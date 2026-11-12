import json
from PIL import Image,ImageDraw
mf=json.load(open('manifest.json'))
items=sorted(mf['dest'].items())
cols=4; cw,ch=480,270
rows=(len(items)+cols-1)//cols
M=Image.new('RGB',(cols*cw,rows*(ch+34)),'white'); d=ImageDraw.Draw(M)
import os
for k,(key,v) in enumerate(items):
    im=Image.open(v['file']).convert('RGB').resize((cw,ch))
    x=(k%cols)*cw; y=(k//cols)*(ch+34)
    M.paste(im,(x,y+34))
    d.text((x+4,y+2),f"{key}  {v['license']}  {os.path.getsize(v['file'])//1024}KB",fill='black')
    d.text((x+4,y+16),v['title'][5:60],fill='gray')
M.save('contact_dest.jpg',quality=85)
print(len(items))
