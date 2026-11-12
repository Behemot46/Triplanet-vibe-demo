import sys,json,os,time,subprocess,re
from find import *
from PIL import Image,ImageDraw
BAD=re.compile(r'\bmaps?\b|logo|diagram|\bplan\b|poster|stamp|coat of arms|\bflag\b|\bicon\b|ticket|brochure|schematic|drawing|painting|engraving|postcard|\.svg|\bmenu\b',re.I)
def thumbdl(url,path):
    if os.path.exists(path) and os.path.getsize(path)>1000: return True
    for i in range(3):
        subprocess.run(['curl','-sS','-A',UA,'-o',path,url])
        try: Image.open(path).verify(); return True
        except Exception: time.sleep(3)
    return False
def run(id,queries,minw,landscape=False,per=5,maxc=8,allow_bad=False):
    seen={};
    for q in queries:
        for r in search(q,12):
            if r['title'] in seen: continue
            seen[r['title']]=r
        time.sleep(0.4)
    c=[r for r in seen.values() if r['ok'] and r['w']>=minw and (not landscape or r['w']>=1.3*r['h']) and (allow_bad or not BAD.search(r['title']))]
    c=c[:maxc]
    json.dump(c,open(f'work/{id}.json','w'))
    ims=[]
    for i,r in enumerate(c):
        p=f'work/{id}_{i}.jpg'
        if thumbdl(r['thumb'],p): ims.append((i,p,r))
        time.sleep(0.3)
    return ims
def montage(items,out,cell=(420,300),cols=4):
    if not items: return
    rows=(len(items)+cols-1)//cols
    M=Image.new('RGB',(cols*cell[0],rows*(cell[1]+16)),'white'); d=ImageDraw.Draw(M)
    for k,(label,p) in enumerate(items):
        try: im=Image.open(p).convert('RGB'); im.thumbnail(cell)
        except Exception: continue
        x=(k%cols)*cell[0]; y=(k//cols)*(cell[1]+16)
        M.paste(im,(x,y+16)); d.text((x+2,y+2),label,fill='red')
    M.save(out,quality=80)
if __name__=='__main__':
    # usage: cands.py id minw landscape(0/1) q1 q2 ...
    id=sys.argv[1];minw=int(sys.argv[2]);ls=sys.argv[3]=='1'
    ims=run(id,sys.argv[4:],minw,ls)
    for i,p,r in ims: print(i,r['w'],'x',r['h'],r['lic'],r['title'][:80],'|',r['desc'][:50])
    montage([(f'{id}#{i}',p) for i,p,r in ims],f'work/m_{id}.jpg')
