import sys,json,os,time,subprocess,re
import find
from PIL import Image
def accept(kind,id,work,idx,crop=(0.5,0.5)):
    r=json.load(open(f'work/{work}.json'))[idx]
    lic=r['lic']; assert find.OK.match(lic),lic
    if kind=='dest': assert r['w']>=1600
    tw=1920 if kind=='dest' else 1280
    if tw>=r['w']: tw=960 if r['w']>960 else r['w']
    url=r['url'] if tw>=r['w'] else re.sub(r'/\d+px-','/%dpx-'%tw,r['thumb']) if r['thumb'] else r['url']
    raw=f'raw/{kind}_{id}.jpg'
    for i in range(10):
        subprocess.run(['curl','-sS','-A',find.UA,'-o',raw,url])
        try: Image.open(raw).verify(); break
        except Exception: time.sleep(12)
    else: raise SystemExit('download failed '+url)
    pg={'title':r['title']}; ii={'descriptionurl':r['src']}
    g=lambda k:{'LicenseUrl':r['licurl'],'Artist':r['artist']}[k]
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
        if os.path.getsize(out)<=lim or q<=40: break
        q-=4
    mf=json.load(open('manifest.json')) if os.path.exists('manifest.json') else {'dest':{},'venue':{},'hotel':{}}
    mf[kind][id]=dict(file=out,title=pg['title'],author=g('Artist')[:200],license=lic,license_url=g('LicenseUrl'),source_url=ii['descriptionurl'])
    json.dump(mf,open('manifest.json','w'),indent=1,ensure_ascii=False)
    print(kind,id,lic,os.path.getsize(out),'q',q)
if __name__=='__main__':
    a=sys.argv; accept(a[1],a[2],a[3],int(a[4]),(float(a[5]),float(a[6]) if len(a)>6 else 0.5) if len(a)>5 else (0.5,0.5))
