from cands import *
ims=run('R3_NE',["Vermont village church autumn","New Hampshire fall foliage lake","Stowe Vermont","autumn foliage White Mountains"],1600,True,maxc=8)
for i,p,r in ims: print(i,r['w'],'x',r['h'],r['lic'],r['title'][:75],flush=True)
montage([(f'NE#{i}',p) for i,p,r in ims],'work/m_R3_NE.jpg')
