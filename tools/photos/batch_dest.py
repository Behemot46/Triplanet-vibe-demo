from cands import *
Q={
'HolyLand':["Jerusalem Old City Dome of the Rock panorama","Jerusalem Old City skyline"],
'Rome':["Colosseum Rome","Rome skyline St Peter's dome"],
'Greece':["Acropolis Athens Parthenon","Parthenon Athens view"],
'Ireland':["Cliffs of Moher","Ireland landscape Killarney","Ring of Kerry landscape"],
'London':["London skyline Thames Tower Bridge","Big Ben Westminster Thames"],
'Niagara':["Niagara Falls Horseshoe Falls","Toronto skyline CN Tower"],
'Branson':["Branson Missouri","Table Rock Lake Branson","Branson Landing"],
'Washington':["Washington Monument reflecting pool","Lincoln Memorial","United States Capitol"],
'Canyon':["Grand Canyon South Rim","Sedona Red Rock Cathedral Rock","Grand Canyon sunset"],
'NewEngland':["New England fall foliage","Stowe Vermont fall foliage church","Vermont autumn foliage"],
'NewYork':["Manhattan skyline","New York City skyline Empire State Building","Brooklyn Bridge Manhattan skyline"],
'Smokies':["Great Smoky Mountains","Smoky Mountains overlook fall","Gatlinburg Tennessee"],
'SanAntonio':["San Antonio River Walk","Texas Hill Country bluebonnets","San Antonio skyline"],
'Chicago':["Chicago skyline","Chicago skyline Lake Michigan","Cloud Gate Chicago skyline"],
'NewOrleans':["New Orleans French Quarter","New Orleans Jackson Square St. Louis Cathedral","New Orleans skyline"],
}
import sys
for k in sys.argv[1:]:
    ims=run('D_'+k,Q[k],1600,True,maxc=8)
    print('==',k)
    for i,p,r in ims: print(i,r['w'],'x',r['h'],r['lic'],r['title'][:75])
    montage([(f'{k}#{i}',p) for i,p,r in ims],f'work/m_D_{k}.jpg')
