import sys,json
from cands import *
H={
'nash-hilton-downtown':("Hilton Nashville Downtown",['hilton','nashville']),
'nash-sheraton-grand':("Sheraton Grand Nashville Downtown",['sheraton','nashville']),
'nash-courtyard-downtown':("Courtyard Marriott Nashville Downtown",['courtyard','nashville']),
'bran-hilton-cc':("Hilton Branson Convention Center",['hilton','branson']),
'bran-hilton-promenade':("Hilton Promenade Branson Landing",['hilton','branson']),
'dc-hyatt-caphill':("Hyatt Regency Washington Capitol Hill",['hyatt','washington']),
'cany-hilton-sedona':("Hilton Sedona Resort Bell Rock",['hilton','sedona']),
'cany-hyatt-phx':("Hyatt Regency Phoenix",['hyatt','phoenix']),
'cany-sheraton-phx':("Sheraton Phoenix Downtown",['sheraton','phoenix']),
'ne-hilton-parkplaza':("Boston Park Plaza hotel",['park plaza']),
'niag-sheraton-fallsview':("Sheraton Fallsview Niagara Falls",['sheraton','fallsview']),
'niag-marriott-fallsview':("Niagara Falls Marriott Fallsview",['marriott','fallsview']),
'niag-hilton-fallsview':("Hilton Niagara Falls Fallsview",['hilton','niagara']),
'ny-sheraton-ts':("Sheraton New York Times Square Hotel",['sheraton','new york']),
'ny-grand-hyatt':("Grand Hyatt New York",['grand hyatt']),
'ny-hyatt-jc':("Hyatt Regency Jersey City",['hyatt','jersey']),
'smok-hilton-knox':("Hilton Knoxville",['hilton','knoxville']),
'sa-hyatt-rw':("Hyatt Regency San Antonio Riverwalk",['hyatt','san antonio']),
'sa-hilton-palacio':("Hilton Palacio del Rio",['palacio']),
'chi-sheraton':("Sheraton Grand Chicago",['sheraton','chicago']),
'chi-hyatt-reg':("Hyatt Regency Chicago",['hyatt','chicago']),
'nola-sheraton':("Sheraton New Orleans Hotel",['sheraton','new orleans']),
'nola-hyatt-reg':("Hyatt Regency New Orleans",['hyatt','new orleans']),
'hl-dan-jer':("Dan Jerusalem hotel",['dan','jerusalem']),
'hl-dan-tlv':("Dan Tel Aviv hotel",['dan','tel aviv']),
'hl-cp-jer':("Crowne Plaza Jerusalem",['crowne','jerusalem']),
'hl-leo-tib':("Leonardo Club Hotel Tiberias",['leonardo','tiberias']),
'rome-hilton-apt':("Hilton Rome Airport",['hilton','rome']),
'rome-sheraton-pdm':("Sheraton Roma Parco de Medici hotel",['sheraton','roma']),
'rome-domus-pacis':("Domus Pacis Assisi",['domus pacis']),
'gr-hilton-athens':("Hilton Athens hotel",['hilton','athens']),
'gr-divani-caravel':("Divani Caravel Athens",['caravel']),
'gr-cp-athens':("Crowne Plaza Athens",['crowne','athens']),
'ie-hilton-kilmainham':("Hilton Dublin Kilmainham",['hilton','kilmainham']),
'ie-hyatt-liberties':("Hyatt Centric The Liberties Dublin",['hyatt','liberties']),
'ie-hgi-customhouse':("Hilton Garden Inn Dublin Custom House",['garden inn','dublin']),
'ie-brehon':("Brehon Hotel Killarney",['brehon']),
'ldn-hilton-metropole':("Hilton London Metropole",['metropole']),
'ldn-sheraton-pl':("Sheraton Grand London Park Lane",['sheraton','park lane']),
}
ids=sys.argv[1:] or list(H)
for id in ids:
    q,tok=H[id]
    # run() filters by license; we add token filter here
    ims=run('H_'+id,[q],500,False,maxc=6,flt=lambda r:all(t in (r['title']+' '+r['desc']).lower() for t in tok))
    print('==H',id,len(ims),flush=True)
    for i,p,r in ims: print(i,r['w'],'x',r['h'],r['lic'],r['title'][:80],'|',r['desc'][:50],flush=True)
    montage([(f'{id}#{i}',p) for i,p,r in ims],f'work/m_H_{id}.jpg',cell=(300,225))
print('ALLDONE',flush=True)
