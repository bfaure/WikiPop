var background = chrome.extension.getBackgroundPage();
var export_data=
{
	views: [],
	date: [],
}

$(document).ready (jQueryMain);

function get_http_xml(url)
{
	var xml_http = new XMLHttpRequest();
	xml_http.open("GET",url,false);
	xml_http.send(null);
	return xml_http.responseText;
}

// returns the rank of this article in the top 1000 most viewed articles
// yesterday, if not in the list, returns -1
function get_view_ranking(article_name)
{
	var cur_date = new Date();
	cur_date.setDate(cur_date.getDate()-1); // set to yesterday

	// convert yesterday to string rep.
	var yr  = String(cur_date.getFullYear());
	var mth = String(cur_date.getMonth()+1);
	if (parseInt(mth)<10){ mth = "0"+mth; }
	var day = String(cur_date.getDate());
	if (parseInt(day)<10){ day = "0"+day; }

	// construct request url
	var url = "https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia.org/";
	url    += "all-access/"+yr+"/"+mth+"/"+day;

	// request the json from mediawiki
	var data = get_http_xml(url);
	data     = JSON.parse(data);

	// iterate through articles to see if article_name is in there
	for (var i=0; i<data.items[0].articles.length; i++){
		if (data.items[0].articles[i].article==article_name){  return data.items[0].articles[i].rank;  }
	}
	return -1;
}

// returns true if the provided date is a weekend, false o.w.
var is_weekend =  function(dt){
    if(dt.getDay() == 6 || dt.getDay() == 0){  return true;  } 
    return false;
}

// article name: (with underscores)
// increment: [daily,monthly]
// start: YYYYMMDD format
// end: YYYYMMDD format
function get_pageviews(article_name,increment,start,end)
{
	var url = "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/";
	url += "en.wikipedia.org/all-access/all-agents/"+article_name+"/";
	url += increment+"/"+start+"/"+end;
	var data = get_http_xml(url);
	return data;
}

// article name: (with underscores)
// increment: [daily,monthly]
// start: YYYYMMDD format
// end: YYYYMMDD format
function get_pageviews_agent(article_name,increment,start,end,agent)
{
	var url = "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/";
	url += "en.wikipedia.org/all-access/"+agent+"/"+article_name+"/";
	url += increment+"/"+start+"/"+end;
	var data = get_http_xml(url);
	return data;
}

function get_daily_views(article_name,year)
{

	var num_days = 1;
	var interval = "monthly";

	if (String(year)=="last_30")
	{

		var d1 = new Date();
		var current_year = d1.getFullYear();
		var current_month = d1.getMonth()+1;
		if (current_month<10)
		{
			current_month = "0"+String(current_month);
		}

		var current_day = d1.getDate();
		if (current_day<10)
		{
			current_day = "0"+String(current_day);
		}

		var d0 = new Date();
		d0.setDate(d1.getDate()-30);
		var earlier_year = d0.getFullYear();
		var earlier_month = d0.getMonth()+1;
		if (earlier_month<10)
		{
			earlier_month = "0"+String(earlier_month);
		}
		var earlier_day = d0.getDate();
		if (earlier_day<10)
		{
			earlier_day = "0"+String(earlier_day);
		}

		var start_date = String(earlier_year)+String(earlier_month)+String(earlier_day);
		var end_date = String(current_year)+String(current_month)+String(current_day);

		interval = "daily";
		num_days = 30;
	}
	else
	{
		var start_date = String(year)+"0101";
		var end_date = String(year)+"1231";
		num_days = 365;
	}

	var data = get_pageviews(article_name,interval,start_date,end_date);
	var obj = JSON.parse(data);

	var total = 0;
	for (var i=0; i<obj.items.length; i++)
	{
		total += obj.items[i].views;
	}

	var daily = total/num_days;
	return daily;
}

function make_view_plot(article_name)
{

	let interval = "daily";
	let start_date = "20150101";

	let d1 = new Date();

	let current_year = d1.getFullYear();

	let current_month = d1.getMonth()+1;
	if (current_month<10){  current_month = "0"+String(current_month);  }

	let current_day = d1.getDate();
	if (current_day<10){  current_day = "0"+String(current_day);  }

	let end_date = String(current_year)+String(current_month)+String(current_day);

	let human_traffic 	  = get_pageviews_agent(article_name,interval,start_date,end_date,"user");
	let human_traffic_obj = JSON.parse(human_traffic);

	let short_moving_avg =
	{
		x: [],
		y: []
	};

	let long_moving_avg =
	{
		x: [],
		y: [],
	};

	let daily_views =
	{
		x: [],
		y: [],
	}

	let n_days_long = 50;
	let n_days_short = 7;

	let total_views = 0;

	let weekend_views=0;
	let weekday_views=0;

	for (var i=0; i<human_traffic_obj.items.length; i++)
	{
		export_data.views.push(human_traffic_obj.items[i].views);
		export_data.date.push(human_traffic_obj.items[i].timestamp);

		let ts=human_traffic_obj.items[i].timestamp;
		let dt=new Date(parseInt(ts.substring(0,4)),parseInt(ts.substring(4,6))-1,parseInt(ts.substring(7,8)),0,0);
		if (is_weekend(dt)){  weekend_views+=human_traffic_obj.items[i].views;  }
		else{                 weekday_views+=human_traffic_obj.items[i].views;  }

		if (i>=n_days_long)
		{
			var cur_sum_long = 0;
			var cur_sum_short = 0;

			for (var j=i-n_days_long; j<i; j++)
			{
				cur_sum_long += human_traffic_obj.items[j].views;

				if (j>=i-n_days_short)
				{
					cur_sum_short += human_traffic_obj.items[j].views;
				}
			}
			var moving_avg_short = cur_sum_short/n_days_short;
			var moving_avg_long = cur_sum_long/n_days_long;

			var timestamp = String(human_traffic_obj.items[i].timestamp);
			timestamp 	  = timestamp.substr(0,4)+"-"+timestamp.substr(4,2)+"-"+timestamp.substr(6,2);

			short_moving_avg.y.push(moving_avg_short);
			short_moving_avg.x.push(timestamp);

			long_moving_avg.y.push(moving_avg_long);
			long_moving_avg.x.push(timestamp);

			daily_views.y.push(human_traffic_obj.items[i].views);
			daily_views.x.push(timestamp);
		}
		total_views+=human_traffic_obj.items[i].views;
	}
	let average_views = total_views/human_traffic_obj.items.length;
	let len = human_traffic_obj.items.length;

	let views_last_week=0;
	/*
	for (let i=human_traffic_obj.items.length-8; i<human_traffic_obj.items.length; i++)
	{
		views_last_week+=human_traffic_obj.items[i].views;
	}
	*/

	// trimming down to 365 days...
	short_moving_avg.y = short_moving_avg.y.slice(len-366,len-1);
	short_moving_avg.x = short_moving_avg.x.slice(len-366,len-1);

	long_moving_avg.y = long_moving_avg.y.slice(len-366,len-1);
	long_moving_avg.x = long_moving_avg.x.slice(len-366,len-1);

	daily_views.y = daily_views.y.slice(len-366,len-1);
	daily_views.x = daily_views.x.slice(len-366,len-1);

	let short_moving_avg_trace =
	{
		name: String(n_days_short)+" MA",
		x: short_moving_avg.x,
		y: short_moving_avg.y,
		type: 'scatter',
		line: {width: 1},
		fill: 'tozeroy'
	};

	let long_moving_avg_trace =
	{
		name: String(n_days_long)+" MA",
		x: long_moving_avg.x,
		y: long_moving_avg.y,
		type: 'scatter',
		line: {width: 1}
	};


	let volume_trace =
	{
		name: "Views",
		x: daily_views.x,
		y: daily_views.y,
		type: 'scatter',
		line: {width: 0, color: ('rgb(128,128,128)')},
		fill: 'tozeroy'
	};

	let layout = {

		xaxis:
		{
			type: 'date',

			tickfont:
			{
				size: 10
			}

		},

		yaxis:
		{
			//range: [0,max_views],

			type: 'log',
			autorange: true,

			tickfont:
			{
				size: 10
			}
		},

		margin:
		{
			t: 10,
			r: 10,
			l: 25,
			b: 25
		},

		paper_bgcolor: "#f8f9fa",
		plot_bgcolor: "#f8f9fa",
		showlegend: false
	};

	$("body").append("<div id=\"plot\" style=\"width:263px;height:150px;\"></div>")

	let plot_spot = document.getElementById('plot');
	let data = [short_moving_avg_trace,long_moving_avg_trace,volume_trace];

	Plotly.plot
	(
		plot_spot,
		data,
		layout,
		{displayModeBar: false}
	);

	let interest_index=(weekend_views/weekday_views)*100.0
	let ret_arr = [average_views,views_last_week,interest_index];
	return ret_arr;
}

// Provided a referenced to a callback function, finds the URL of the
// current tab and routes it to the callback function.
function get_url(callback)
{
	chrome.runtime.sendMessage({func: "get_url"},function(response)
	{
		callback(String(response.data));
	});
}

// Checks the wikimedia API to see if the current article is a film or movie
function get_article_type(article)
{
	console.log("get_article_type: ",article);

	var url = "https://en.wikipedia.org/w/api.php?action=query&format=json&prop=categories&titles="+article;
	var data = get_http_xml(url);
	data     = JSON.parse(data);
	console.log("mediawiki categories: ",url);

	var pages = data.query.pages;
	var first_key = Object.keys(pages)[0];
	let tags=["novel","film","series","television","show","episode","book series","cryptocurrencies"];
	let tag_cts=[0,0,0,0,0,0,0,0];

	console.log(pages[first_key]['categories']);
	console.log(pages[first_key]);

	if ("categories" in pages[first_key])
	{
		var cats=pages[first_key]["categories"];
		for (var cat_idx=0; cat_idx<cats.length; cat_idx++)
		{
			if (cats[cat_idx]["title"].toLowerCase().indexOf("births")!=-1 || cats[cat_idx]["title"].toLowerCase().indexOf("deaths")!=-1){
				return -1;
			}
			for (var tag_idx=0; tag_idx<tags.length; tag_idx++)
			{
				if (cats[cat_idx]["title"].toLowerCase().indexOf(tags[tag_idx])!==-1)
				{
					tag_cts[tag_idx]+=1;
				}				
			}
		}
	}

	let max_idx=-1;
	let max_val=0;
	for (let i=0; i<tag_cts.length; i+=1){
		if (tag_cts[i]>max_val){
			max_idx=i;
			max_val=tag_cts[i];
		}
	}
	if (max_idx!=-1){
		return tags[max_idx];
	}
	// article categories don't seem to show this article
	// is a movie or a tv show, return -1
	return -1; 
}

// replaces common url strings with their appropriate true characters, for
// fixing movie and tv show titles to fit what would be seen on imdb
function deurlify(title)
{
	title=title.split("+").join("%2B").split("_").join("%20");
	if (title.indexOf("%20(")!=-1 && title.indexOf("film)")!=-1){
		title=title.split("%20(")[0];
	}
	return title;
}

// performs IMDb search for the title argument, what is searched depends on 
// the second category parameter, could be one of ['film','series',television','show','episode']
function search_imdb(title,category){
	console.log("title (before): ",title);
	title=deurlify(title);
	console.log("category: ",category);
	console.log("title (after): ",title);

    let filter_mapping={'film':      "https://www.imdb.com/find?q=[INSERT_HERE]&s=tt&ttype=ft&ref_=fn_ft",
						'series':    "https://www.imdb.com/find?q=[INSERT_HERE]&s=tt&ttype=tv&ref_=fn_tv",
						'television':"https://www.imdb.com/find?q=[INSERT_HERE]&s=tt&ttype=tv&ref_=fn_tv",
						'show':      "https://www.imdb.com/find?q=[INSERT_HERE]&s=tt&ttype=tv&ref_=fn_tv",
						'episode':   "https://www.imdb.com/find?q=[INSERT_HERE]&s=tt&ttype=ep&ref_=fn_ep"};
	let query=filter_mapping[category].split("[INSERT_HERE]").join(title);
	let search_data=get_http_xml(query);
	let sim_dom=document.createElement("div");
	sim_dom.innerHTML=search_data;

	console.log("imdb search results...");
	console.log(sim_dom);

	let first_result=sim_dom.querySelector("td.result_text");
	let first_result_url="https://www.imdb.com"+first_result.querySelector("a").getAttribute("href").split("?ref")[0];

	let result_data=get_http_xml(first_result_url);
	sim_dom.innerHTML=result_data;

	let parsed_data={};
	parsed_data['url']=first_result_url;
	parsed_data['score']=sim_dom.querySelector("div.ratingValue").innerText.split("\n").join("").trim();
	parsed_data['volume']=sim_dom.querySelector("div.imdbRating").querySelector("span.small").innerText;

	let metadata=sim_dom.querySelector("div.subtext").innerText.split("|");
	for(let i=0; i<metadata.length; i+=1){
		metadata[i]=metadata[i].split("\n").join("").trim();
		if (i==0){  parsed_data['mpaa']=metadata[i]    }
		if (i==1){  parsed_data['duration']=metadata[i]}
		if (i==2){  parsed_data['genre']=metadata[i]   }
		if (i==3){  
			if (metadata[i].indexOf("Episode aired ")!=-1){
				parsed_data['date']=metadata[i].split("Episode aired ")[1];    	
			} else {
				parsed_data['date']=metadata[i];    	
			}
		}
	}
	return parsed_data;
}

// searches goodreads for entries pertaining to the provided title
function search_goodreads(title,category){
	console.log("search_goodreads()");
	console.log("title: ",title);
	console.log("category: ",category);

	title=title.split("_").join("+");
	let query="https://www.goodreads.com/search?q="+title;

	console.log("goodreads url: ",query);

	let search_data=get_http_xml(query);
	let sim_dom=document.createElement("div");
	sim_dom.innerHTML=search_data;

	console.log("goodreads search results...");
	console.log(sim_dom);

	let results={};
	results['url']="https://www.goodreads.com"+sim_dom.querySelector("a.bookTitle").getAttribute("href");

	let first_result=sim_dom.querySelector("span.minirating");
	console.log(first_result);

	let first_result_text=first_result.textContent;
	console.log(first_result_text)

	results['score']=first_result_text.split("avg")[0].trim();
	results['volume']=first_result_text.split("—")[1].split(" ratings")[0].trim();

	console.log(results);

	return results;
}

function search_coinmarketcap(title){
	let url="https://coinmarketcap.com/search/?q="+title.split("_").join("+");
	console.log(url);

	let search_data=get_http_xml(url);
	let sim_dom=document.createElement("div");
	sim_dom.innerHTML=search_data;

	console.log(sim_dom);

	let results=sim_dom.querySelector("ul.search-results");
	
	let all_results=results.querySelectorAll("a");
	console.log("all results.,..");
	console.log(all_results);
	let actual_result=null;
	title=title.split("_").join(" ");
	for (let i=0; i<all_results.length; i++){
		let current_crypto_name=all_results[i].innerText;
		console.log(current_crypto_name);
		if (current_crypto_name.toLowerCase().indexOf(title.toLowerCase())!=-1){
			actual_result=all_results[i].getAttribute("href");
			break;
		}
	}

	//let first_result=results.querySelector("a").getAttribute("href");

	let result_url="https://coinmarketcap.com/"+actual_result;
	console.log(result_url);

	search_data=get_http_xml(result_url);
	sim_dom=document.createElement("div");
	sim_dom.innerHTML=search_data;

	console.log(sim_dom);
	
	let percent_change=sim_dom.querySelector("span.h2.text-semi-bold.negative_change");
	if (percent_change==null){
		percent_change=sim_dom.querySelector("span.h2.text-semi-bold.positive_change");
	}
	percent_change=percent_change.textContent;

	let price=sim_dom.querySelector("span#quote_price").getAttribute("data-usd");

	let final_results={'price':"$"+price, 'url':result_url, 'change':percent_change}

	let details_pane=sim_dom.querySelectorAll("div.coin-summary-item-detail");
	console.log(details_pane);
	for(let i=0; i<2; i+=1){
		let cur_item=details_pane[i].querySelector("span").querySelector("span").textContent;
		if (i==0){
			final_results['market cap']=cur_item;
		}
		if (i==1){
			final_results['volume']=cur_item;
		}
	}

	return final_results; 
}

function process_url(tablink)
{
	// if this will be a banner, don't add content
	if (tablink=="https://www.wikipedia.org" || tablink=="https://www.wikipedia.org/")
	{
		return;
	}

	// create minimize and maximize buttons
	let minimize_button = document.createElement("img");
	minimize_button.src=chrome.extension.getURL("/icons/minimize.png");
	minimize_button.style="height:10px;width:10px;position:absolute;float:right;right:16px;top:12px;cursor:pointer";
	minimize_button.onclick = function()
	{
		parent.postMessage("minimize","*");
		minimize_button.style.display="none";
		maximize_button.style.display="inherit";
	}
	$("body").append(minimize_button);

	let maximize_button = document.createElement("img");
	maximize_button.src=chrome.extension.getURL("/icons/maximize.png");
	maximize_button.style="height:15px;width:15px;position:absolute;float:right;right:14px;top:10px;cursor:pointer";
	maximize_button.style.display="none";
	maximize_button.onclick = function()
	{
		parent.postMessage("maximize","*");
		maximize_button.style.display="none";
		minimize_button.style.display="inherit";
	}
	$("body").append(maximize_button);


	// get the article name
	var article = tablink.split("/wiki/")[1];
	article = article.split("#")[0]; // remove extra in url specifying part of page to load to

	var article_pretty = article.split("_").join(" ").split("%27").join("\'").split("%E2%80%93").join("-");
	article_pretty = article_pretty.split("%C3%AD").join("í");
	article_pretty = article_pretty.split("%C3%A1").join("á");
	article_pretty = article_pretty.split("%C3%B8").join("ø");
	article_pretty = article_pretty.split("%C3%A9").join("é");
	article_pretty = article_pretty.split("%C3%97").join("x").split("%26").join("&");

	let download_name=article+"-view_data.csv";
	let img_src=chrome.extension.getURL("/icons/download.png");
	var link="<a id=\"csv_download\" title=\"Download Plot Data as CSV\" download=\""+download_name+"\" href=\"temp\"><img style=\"height:10px;width:10px;float:left;margin-top:3px;margin-left:10px;margin-right:-48px\" src=\""+img_src+"\"/></a>";

	$("body").append("<div class=\"bg-text\">"+link+"Popularity</div>");
	
	var views_arr = make_view_plot(article); // returns array with [avg_daily_views,views_last_week]
	var avg_daily_views = views_arr[0];
	
	var avg_daily_views_pretty = String(avg_daily_views.toLocaleString('en-US',{minimumFractionDigits: 2})).split(".")[0];
	var avg_daily_views_line = "<b>Average Views</b>&nbsp;&nbsp;"+avg_daily_views_pretty+" / day";
	$("body").append("<p>"+avg_daily_views_line+"</p>");

	let interest_index_line="<b>Interest Index</b>&nbsp;&nbsp;&nbsp;"+String(views_arr[2].toFixed(2))+"%";
	$("body").append("<p title=\"% of views on the weekend\">"+interest_index_line+"</p>");

	// check if a trending article
	var rank = get_view_ranking(article);
	if (rank!=-1)
	{
		var trending_line = "<b style=\"color:green\">Trending</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;#"+String(rank)+" Yesterday";
		$("body").append("<p>"+trending_line+"</p>");
		parent.postMessage("trending_resize","*");
	}

	let article_type = get_article_type(article);
	console.log("article_type: ",article_type);

	// add the csv data
	let csvContent="data:text/csv;charset=utf-8,Date,Views\r\n";
	for(let q=0; q<export_data.views.length; q+=1){
		csvContent+=String(export_data.date[q])+","+String(export_data.views[q])+"\r\n";
	}
	var data_url=encodeURI(csvContent);
	document.getElementById("csv_download").href=data_url;

	let movie_tv_tags=["film","series","television","show","episode"];
	let book_tags=["book series","novel"];
	let crypto_tags=["cryptocurrencies"];

	if (article_type!=-1) 
	{
		if (movie_tv_tags.indexOf(article_type)!=-1){ // if the article is a tv show or movie
			results=search_imdb(article,article_type);

			let rating_line = "<b>&nbsp;&nbsp;Rating</b> &nbsp;"+results['score']+" ("+results['volume']+" reviews)";
			let mpaa_line = "<b>&nbsp;&nbsp;MPAA Rating</b> &nbsp;"+results['mpaa'];
			let genre_line = "<b>&nbsp;&nbsp;Genre</b> &nbsp;"+results['genre'];
			let duration_line = "<b>&nbsp;&nbsp;Duration</b> &nbsp;"+results['duration'];
			let date_line= "<b>&nbsp;&nbsp;Released</b> &nbsp;"+results['date'];

			$("body").append("<div class=\"bg-text\"><a href=\""+results['url']+"\" target=\"_blank\"><div class=\"bg-text\">IMDb Results</div></a></div>");
			$("body").append("<p>"+rating_line+"</p>");
			$("body").append("<p>"+mpaa_line+"</p>");
			$("body").append("<p>"+genre_line+"</p>");
			$("body").append("<p>"+duration_line+"</p>");
			$("body").append("<p>"+date_line+"</p>");

			parent.postMessage("imdb_resize","*"); // resize the iframe to fit imdb stuff
		}
		if (book_tags.indexOf(article_type)!=-1){ // if the article is a book
			results=search_goodreads(article,article_type);

			let rating_line = "<b>&nbsp;&nbsp;Rating</b> &nbsp;&nbsp;"+results['score']+" / 5";
			let volume_line = "<b>&nbsp;&nbsp;Volume</b> &nbsp;"+results['volume']+" ratings";
			$("body").append("<div class=\"bg-text\"><a href=\""+results['url']+"\" target=\"_blank\"><div class=\"bg-text\">Goodreads Results</div></a></div>");
			$("body").append("<p>"+rating_line+"</p>");
			$("body").append("<p>"+volume_line+"</p>");
			
			parent.postMessage("goodreads_resize","*"); // resize the iframe to fit goodreads stuff
		}

		if (crypto_tags.indexOf(article_type)!=-1){
			console.log("is a cryptocurreny!");
			if (article.indexOf("_(crypto")!=-1){
				article=article.split("_(c")[0];
			}
			results=search_coinmarketcap(article);

			let price_line = "<b>&nbsp;&nbsp;Price</b> &nbsp;&nbsp;"+results['price']+" ";
			if (results['change'].indexOf("-")!=-1){
				price_line=price_line+"<b style=\"color:red;font-weight:normal\">"+results['change']+"</b>";
			} else {
				price_line=price_line+"<b style=\"color:green;font-weight:normal\">"+results['change']+"</b>";
			}

			let market_cap_line="<b>&nbsp;&nbsp;Market Cap</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;$"+results['market cap'];
			let volume_line="<b>&nbsp;&nbsp;Volume (24h)</b> &nbsp;&nbsp;$"+results['volume'];

			$("body").append("<div class=\"bg-text\"><a href=\""+results['url']+"\" target=\"_blank\"><div class=\"bg-text\">CoinMarketCap Results</div></a></div>");
			$("body").append("<p>"+price_line+"</p>");
			$("body").append("<p>"+market_cap_line+"</p>");
			$("body").append("<p>"+volume_line+"</p>");

			parent.postMessage("coin_resize","*"); // resize the iframe to fit goodreads stuff
		}
	}
}

function jQueryMain () {
	get_url(process_url);
}
