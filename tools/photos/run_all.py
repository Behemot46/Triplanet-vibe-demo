import sys,json
from cands import *
import batch_venue as bv
Q=json.load(open('queries.json'))
DQ={
'London':["London skyline Thames Tower Bridge"],'Branson':["Branson Missouri Landing"],'Washington':["Washington Monument reflecting pool"],
'Canyon':["Grand Canyon South Rim"],'NewEngland':["New England fall foliage"],'NewYork':["Manhattan skyline"],
'Smokies':["Great Smoky Mountains"],'SanAntonio':["San Antonio River Walk"],'Chicago':["Chicago skyline"],'NewOrleans':["New Orleans French Quarter"],
'Nashville':["Nashville skyline Broadway Cumberland"]}
for k,qs in DQ.items():
    if os.path.exists(f'work/m_D_{k}.jpg') and k not in ('Nashville','London','Branson','Canyon'): continue
    ims=run('D_'+k,qs,1600,True,maxc=8)
    print('==D',k,flush=True)
    for i,p,r in ims: print(i,r['w'],'x',r['h'],r['lic'],r['title'][:75],flush=True)
    montage([(f'{k}#{i}',p) for i,p,r in ims],f'work/m_D_{k}.jpg')
for id in bv.V:
    if os.path.exists(f'work/m_V_{id}.jpg'): continue
    ims=bv.one(id,'V')
    print('==V',id,flush=True)
    for i,p,r in ims: print(i,r['w'],'x',r['h'],r['lic'],r['title'][:75],flush=True)
    montage([(f'{id}#{i}',p) for i,p,r in ims],f'work/m_V_{id}.jpg',cell=(300,225),cols=4)
print('ALLDONE',flush=True)
