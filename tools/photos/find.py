import sys,json,re,time,urllib.parse,subprocess
UA="TriplanetDemoPhotoBot/1.0 (offline booth demo)"
API="https://commons.wikimedia.org/w/api.php"
OK=re.compile(r'^(public domain|cc0|cc[ -]by(-sa)?\b|pd\b|pdm)',re.I)
_last=[0]
def api(**p):
    w=1.2-(time.time()-_last[0])
    if w>0: time.sleep(w)
    _last[0]=time.time()
    p['format']='json'
    url=API+'?'+urllib.parse.urlencode(p)
    for i in range(6):
        r=subprocess.run(['curl','-sS','-A',UA,url],capture_output=True,text=True)
        try: return json.loads(r.stdout)
        except Exception: time.sleep(6+i*6)
    return {}
def strip(s): return re.sub(r'\s+',' ',re.sub(r'<[^>]+>','',s or '')).strip()
def info(titles):
    d=api(action='query',titles='|'.join(titles),prop='imageinfo',iiprop='url|extmetadata|size|mime',iiurlwidth=640)
    out=[]
    for pg in d.get('query',{}).get('pages',{}).values():
        ii=(pg.get('imageinfo') or [None])[0]
        if not ii: continue
        m=ii.get('extmetadata',{})
        g=lambda k:strip(m.get(k,{}).get('value',''))
        out.append(dict(title=pg['title'],w=ii['width'],h=ii['height'],mime=ii['mime'],thumb=ii.get('thumburl'),url=ii['url'],
          lic=g('LicenseShortName'),artist=g('Artist'),licurl=g('LicenseUrl'),desc=g('ImageDescription')[:100],
          src=ii['descriptionurl'],ok=bool(OK.match(g('LicenseShortName')))))
    return out
def search(q,n=15,minw=0):
    d=api(action='query',generator='search',gsrsearch=q,gsrnamespace=6,gsrlimit=n)
    t=[p['title'] for p in d.get('query',{}).get('pages',{}).values()]
    res=[]
    for i in range(0,len(t),10):
        res+=info(t[i:i+10])
    return [r for r in res if r['mime'].startswith('image/jpeg') or r['mime']=='image/png' or r['mime']=='image/tiff']
if __name__=='__main__':
    q=sys.argv[1]; minw=int(sys.argv[2]) if len(sys.argv)>2 else 0
    for r in search(q,20):
        flag='OK ' if r['ok'] else 'NO '
        if r['w']<minw: flag='SM '
        print(flag,r['w'],'x',r['h'],r['lic'],'|',r['title'],'|',r['desc'][:60])
    time.sleep(0.5)
