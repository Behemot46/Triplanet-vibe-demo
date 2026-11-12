import sys,json
from cands import *
T=json.load(open('targets.json'))
V={v['id']:v for v in T['venues']}
H={v['id']:v for v in T['hotels']}
OV=json.load(open('queries.json')) if os.path.exists('queries.json') else {}
def one(id,kind='V'):
    v=(V if kind=='V' else H)[id]
    qs=OV.get(id) or [v['name'],v['name']+' '+v['city']]
    ims=run(kind+'_'+id,qs,800 if kind=='V' else 600,False,maxc=8)
    ims=[x for x in ims if x[2]['w']>=1.1*x[2]['h']]
    return ims
if __name__=='__main__':
    ids=sys.argv[2:]; kind=sys.argv[1]
    allitems=[]
    for id in ids:
        ims=one(id,kind)
        print('==',id)
        for i,p,r in ims: print(i,r['w'],'x',r['h'],r['lic'],r['title'][:80]); 
        sys.stdout.flush()
        montage([(f'{id}#{i}',p) for i,p,r in ims],f'work/m_{kind}_{id}.jpg',cell=(300,225),cols=4)
