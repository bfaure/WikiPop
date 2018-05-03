
lines=open('data.tsv','r').read().split('\n')
f=open('data-clean.tsv','w')

for line in lines:
	items=line.split('\t')
	if len(items)==9:
		time=items[7]
		try: time=int(time)
		except: continue
		if time>10: f.write('%s\t%s\n'%(items[2],items[0]))

