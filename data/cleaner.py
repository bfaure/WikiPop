
lines=open('orig_data.tsv','r').read().split('\n')
f=open('data.tsv','w')

for line in lines:
	items=line.split('\t')
	if len(items)==9:
		time=items[7]
		try: time=int(time)
		except: continue
		if time>12: f.write('%s\t%s\t%s\n'%(items[2],items[0],items[1]))

