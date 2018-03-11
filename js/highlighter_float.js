
// get which category we should be highlighting
var which=0;


// source file for mappings
var map_src = "js/20k_most_common_float-content.txt";

// these need to be the same as those in popup_generator.js
var all_colors = [[0,73,170],[0,170,151],[34,170,0],[128,128,128],[153,0,131],[238,0,0],[238,99,0],[255,234,0],[123,100,0],[0,12,40],[0,80,123]];
var possible_cats = ["film","nature","music","athletics","video_game","economics","war","infrastructure_transport","politics","populated_areas","architecture"];


var mapping = "temp";
var mapping_loaded = false;
function load_mapping()
{
	console.log("Loading mapping");
	var fileURL = chrome.extension.getURL(map_src);
	var xmlreq = new XMLHttpRequest();
	xmlreq.open("GET", fileURL, false); //false makes it syncronous
	xmlreq.send();
	mapping = xmlreq.responseText.split("\n"); //standard splitting by linebreaks
	mapping_loaded = true;
}

// dictionary mapping words to indices in all_colors list
var mapping_dict = {};
var mapping_dict_loaded = false;
function create_mapping_dict()
{
	console.log("Creating mapping-dict")
	for (var line_idx=0; line_idx<mapping.length; line_idx++)
	{
		line_items = mapping[line_idx].split("\t");
		if (line_items.length>4)
		{
			var line_word = String(line_items[0]).toLowerCase(); // word of current line 
			var pred = line_items[which+1];
			mapping_dict[line_word] = pred;
		}
	}
	mapping_dict_loaded=true;
}

// gets the associated alpha for the word
function get_word_alpha(word,word_color)
{
	if (word.toLowerCase() in mapping_dict)
	{
		return mapping_dict[word.toLowerCase()]
	}
}

// gets the associated color for the word
function get_word_color(word)
{
	// assuming music highlighting only...
	return all_colors[which]; 
}

// assembles the tags around the provided word
function assemble_word_wrap(word,color,alpha)
{
	before = "<font style='color:black; background-color:rgba("+color+","+alpha+");'>";
	after = "</font>";
	return before+word+after;
}

// places tags to wrap the input word with correct color
function wrap_word(word)
{
	correct_color = get_word_color(word);
	correct_alpha = get_word_alpha(word,correct_color);
	return assemble_word_wrap(word,correct_color,correct_alpha);
}

function highlight_current_page()
{
	var t0 = new Date();
	if (mapping_dict_loaded==false)
	{
		if (mapping_loaded==false){  load_mapping();  }
		create_mapping_dict();
	}
	var t1 = new Date();
	console.log("Dict Constructor time: "+String((t1-t0)/1000)+" sec");

	var text = document.body.innerHTML; // get all inner html on page
	var words = text.split(" "); // split on " "
	var new_text = ""; // to hold colorized text
	var openct = 0; // track if we are in an html tag

	for (var i=0; i<words.length; i++)
	{
		items = [];
		i1 = words[i].split("<");
		for (var a=0; a<i1.length; a++)
		{
			i2 = i1[a].split(">");
			for (var b=0; b<i2.length; b++)
			{
				items.push(i2[b]);
				if (b!=i2.length-1){  items.push(">");  }
			}
			if (a!=i1.length-1){  items.push("<");  }
		}

		for (var c=0; c<items.length; c++)
		{
			cur              = items[c];
			var prior_openct = openct;
			var skip         = false;
			openct += cur.split("<").length-1;
			openct -= cur.split(">").length-1;
			if (cur.indexOf(">")!=-1 || cur.indexOf("<")!=-1){  skip = true;                 }
			if (openct==0 && skip==false)                    {  new_text += wrap_word(cur);  }
			else                                             {  new_text += cur;             }
		}
		if (i!=words.length-1){  new_text+=" ";  }
	}
	document.body.innerHTML = new_text;

	var t2 = new Date();
	console.log("Total highlighting time: "+String((t2-t0)/1000)+" sec");
}

chrome.storage.sync.get("category",function(data){
  console.log(data.category);
  which = parseInt(data.category);
  highlight_current_page();
});

