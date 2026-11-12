from cands import *
for k,qs in {'NewEngland':["Stowe Vermont fall foliage","Stowe Community Church Vermont","Vermont autumn foliage"],'Nashville':["Nashville pano Opry Broadway","Nashville Broadway skyline downtown"]}.items():
    ims=run('R2_'+k,qs,1600,True,maxc=8)
    print('==',k,flush=True)
    for i,p,r in ims: print(i,r['w'],'x',r['h'],r['lic'],r['title'][:75],flush=True)
    montage([(f'{k}#{i}',p) for i,p,r in ims],f'work/m_R2_{k}.jpg')
print('ALLDONE')
