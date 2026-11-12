import sys,json,os,time,subprocess,re
import find
from PIL import Image
def accept(kind,id,title,crop=(0.5,0.5)):
    if not title.startswith('File:'): title='File:'+title
    d=find.api(action='query',titles=title,prop='imageinfo',iiprop='url|extmetadata|size|mime',iiurlwidth=1920 if kind=='dest' else 1280)
    pg=list(d['query']['pages'].values())[0]; ii=pg['imageinfo'][0]; m=ii['extmetadata']
    g=lambda k:find.strip(m.get(k,{}).get('value',''))
    lic=g('LicenseShortName'); assert find.OK.match(lic),lic
    if kind=='dest': assert ii['width']>=1600
    url=ii.get('thumburl') or ii['url']
    raw=f'raw/{kind}_{id}.jpg'
    for i in range(3):
        subprocess.run(['curl','-sS','-A',find.UA,'-o',raw,url])
        try: Image.open(raw).verify(); break
        except Exception: time.sleep(4)
    im=Image.open(raw).convert('RGB')
    tw,th=(16,9) if kind=='dest' else (4,3)
    W,H=im.size
    if W/H>tw/th: nw=int(H*tw/th); x=int((W-nw)*crop[0]); box=(x,0,x+nw,H)
    else: nh=int(W*th/tw); y=int((H-nh)*crop[1]); box=(0,y,W,y+nh)
    im=im.crop(box).resize((1280,720) if kind=='dest' else (480,360),Image.LANCZOS)
    os.makedirs(f'out/{kind}',exist_ok=True)
    out=f'out/{kind}/{id}.webp'
    q=58 if kind=='dest' else 55; lim=90000 if kind=='dest' else 30000
    while True:
        im.save(out,'WEBP',quality=q,method=6)
        if os.path.getsize(out)<=lim or q<=42: break
        q-=4
    mf=json.load(open('manifest.json')) if os.path.exists('manifest.json') else {'dest':{},'venue':{},'hotel':{}}
    mf[kind][id]=dict(file=out,title=pg['title'],author=g('Artist')[:200],license=lic,license_url=g('LicenseUrl'),source_url=ii['descriptionurl'])
    json.dump(mf,open('manifest.json','w'),indent=1,ensure_ascii=False)
    print(kind,id,lic,os.path.getsize(out),'q',q)
if __name__=='__main__':
    a=sys.argv; accept(a[1],a[2],a[3],(float(a[4]),0.5) if len(a)>4 else (0.5,0.5))
