import sys,json
from cands import *
DR={'Branson':["Table Rock Lake Branson Missouri sunset","Branson Missouri Highway 76 strip"],
 'NewEngland':["Stowe Vermont church fall foliage","Vermont covered bridge autumn foliage"],
 'NewOrleans':["Jackson Square St. Louis Cathedral New Orleans","French Quarter balconies New Orleans"],
 'Nashville':["Nashville Broadway honky tonk","Nashville skyline John Seigenthaler Pedestrian Bridge"]}
VR={'bran-sight-sound':["Sight & Sound Theatres Branson exterior"],'bran-stampede':["Dolly Parton's Stampede Branson Missouri"],
 'dc-nasm':["National Air and Space Museum exterior Independence Avenue"],'dc-odyssey':["Odyssey cruise boat Washington DC Potomac"],
 'ny-radio':["Radio City Music Hall facade"],'ny-broadway':["Broadway theatre marquee New York"],
 'smok-stampede':["Dolly Parton's Stampede Pigeon Forge"],'sa-lbj':["LBJ Ranch Texas White House"],
 'chi-skydeck':["Willis Tower Chicago exterior"],'chi-cac':["Chicago architecture river cruise"],
 'gr-delphi':["Delphi Temple of Apollo"],'ie-guinness':["Guinness Storehouse building Dublin"]}
for k,qs in DR.items():
    ims=run('RD_'+k,qs,1600,True,maxc=8)
    print('==RD',k,flush=True)
    for i,p,r in ims: print(i,r['w'],'x',r['h'],r['lic'],r['title'][:75],flush=True)
    montage([(f'{k}#{i}',p) for i,p,r in ims],f'work/m_RD_{k}.jpg')
for k,qs in VR.items():
    ims=run('RV_'+k,qs,800,False,maxc=8)
    ims=[x for x in ims if x[2]['w']>=1.1*x[2]['h']]
    print('==RV',k,flush=True)
    for i,p,r in ims: print(i,r['w'],'x',r['h'],r['lic'],r['title'][:75],flush=True)
    montage([(f'{k}#{i}',p) for i,p,r in ims],f'work/m_RV_{k}.jpg',cell=(300,225))
print('ALLDONE',flush=True)
