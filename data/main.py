# Python 2.7

# data sets from https://datasets.imdbws.com/
# titles.tsv needs to be "title.basics.tsv.gz" (then uncompress)
# ratings.tsv needs to be "title.ratings.tsv.gz" (then uncompress)
# both datasets can be downloaded from the link above

# this script compiles together data from titles.tsv & ratings.tsv
# and writes out the information to a new file called data.tsv

names_f=open("titles.tsv","r")
ratings_f=open("ratings.tsv","r")

dest_f=open("data.tsv","w")

# dictionary mapping from tconst (string) to actual name (string)
names_dict={}

print "Parsing names..."
text=names_f.read().split("\n")
for line in text:
	items=line.strip().split("\t")
	if len(items)==9 and items[0]!="tconst":
		tconst=items[0]
		primaryTitle=items[2]
		names_dict[tconst]=primaryTitle

# dictionary mapping from actual name (string) to list containing [averageRating,numVotes]
ratings_dict={}

print "Parsing ratings..."
text=ratings_f.read().split("\n")
for line in text:
	items=line.strip().split("\t")
	if len(items)==3 and items[0]!="tconst":
		tconst=items[0]
		rating=items[1]
		count=items[2]
		try: name=names_dict[tconst]
		except: continue
		if name in ratings_dict and ratings_dict[name][1]>count: continue
		ratings_dict[name]=[rating,count]

print "Saving to data.tsv..."
dest_f.write("title\taverage_rating\tnum_votes\n")
for name,values in ratings_dict.items():
	dest_f.write("%s\t%s\t%s\n"%(
		name,values[0],values[1]))

dest_f.close()
ratings_f.close()
names_f.close()
print "Done."



