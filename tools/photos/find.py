import sys,json,re,time,urllib.parse,subprocess
UA="TriplanetDemoPhotoBot/1.0 (offline booth demo)"
API="https://commons.wikimedia.org/w/api.php"
OK=re.compile(r'^(public domain|cc0|cc[ -]by(-sa)?\b|pd\b|pdm)',re.I)
_last=[0]
GAP=[14]
def api(**p):
    p['format']='json'
    url=API+'?'+urllib.parse.urlencode(p)
    for i in range(40):
        w=GAP[0]-(time.time()-_last[0])
        if w>0: time.sleep(w)
        r=subprocess.run(['curl','-sS','-D','work/hdr.txt','-A',UA,url],capture_output=True,text=True)
        _last[0]=time.time()
        hdr=open('work/hdr.txt').read()
        code=re.findall(r'HTTP/[\d.]+ (\d+)',hdr)[-1] if hdr else '?'
        open('work/api.log','a').write(time.strftime('%H:%M:%S ')+code+' gap%d '%GAP[0]+str(p.get('gsrsearch') or p.get('titles'))[:40]+'\n')
        if code=='200':
            try: return json.loads(r.stdout)
            except Exception: pass
        else:
            m=re.search(r'retry-after: *(\d+)',hdr,re.I)
            time.sleep(int(m.group(1)) if m else 5)
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
    d=api(action='query',generator='search',gsrsearch=q,gsrnamespace=6,gsrlimit=n,prop='imageinfo',iiprop='url|extmetadata|size|mime',iiurlwidth=640)
    return parse(d)
def parse(d):
    out=[]
    for pg in sorted(d.get('query',{}).get('pages',{}).values(),key=lambda p:p.get('index',0)):
        ii=(pg.get('imageinfo') or [None])[0]
        if not ii: continue
        m=ii.get('extmetadata',{})
        g=lambda k:strip(m.get(k,{}).get('value',''))
        r=dict(title=pg['title'],w=ii['width'],h=ii['height'],mime=ii['mime'],thumb=ii.get('thumburl'),url=ii['url'],
          lic=g('LicenseShortName'),artist=g('Artist'),licurl=g('LicenseUrl'),desc=g('ImageDescription')[:100],
          src=ii['descriptionurl'],ok=bool(OK.match(g('LicenseShortName'))))
        if r['mime'] in('image/jpeg','image/png','image/tiff'): out.append(r)
    return out
if __name__=='__main__':
    q=sys.argv[1]; minw=int(sys.argv[2]) if len(sys.argv)>2 else 0
    for r in search(q,20):
        flag='OK ' if r['ok'] else 'NO '
        if r['w']<minw: flag='SM '
        print(flag,r['w'],'x',r['h'],r['lic'],'|',r['title'],'|',r['desc'][:60])
    time.sleep(0.5)
