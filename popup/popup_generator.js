
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
	var interval = "daily";
	var start_date = "20150101";

	var d1 = new Date();

	var current_year = d1.getFullYear();

	var current_month = d1.getMonth()+1;
	if (current_month<10){  current_month = "0"+String(current_month);  }

	var current_day = d1.getDate();
	if (current_day<10){  current_day = "0"+String(current_day);  }

	var end_date = String(current_year)+String(current_month)+String(current_day);

	var human_traffic 	  = get_pageviews_agent(article_name,interval,start_date,end_date,"user");
	var human_traffic_obj = JSON.parse(human_traffic);

	var short_moving_avg =
	{
		x: [],
		y: []
	};

	var long_moving_avg =
	{
		x: [],
		y: [],
	};

	var daily_views =
	{
		x: [],
		y: [],
	}

	var n_days_long = 50;
	var n_days_short = 7;

	var total_views = 0;

	for (var i=0; i<human_traffic_obj.items.length; i++)
	{
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
	var average_views = total_views/human_traffic_obj.items.length;
	var len = human_traffic_obj.items.length;

	var views_last_week=0;
	for (var i=human_traffic_obj.items.length-8; i<human_traffic_obj.items.length; i++)
	{
		views_last_week+=human_traffic_obj.items[i].views;
	}

	// trimming down to 365 days...
	short_moving_avg.y = short_moving_avg.y.slice(len-366,len-1);
	short_moving_avg.x = short_moving_avg.x.slice(len-366,len-1);

	long_moving_avg.y = long_moving_avg.y.slice(len-366,len-1);
	long_moving_avg.x = long_moving_avg.x.slice(len-366,len-1);

	daily_views.y = daily_views.y.slice(len-366,len-1);
	daily_views.x = daily_views.x.slice(len-366,len-1);

	var short_moving_avg_trace =
	{
		name: String(n_days_short)+" MA",
		x: short_moving_avg.x,
		y: short_moving_avg.y,
		type: 'scatter',
		line: {width: 1},
		fill: 'tozeroy'
	};

	var long_moving_avg_trace =
	{
		name: String(n_days_long)+" MA",
		x: long_moving_avg.x,
		y: long_moving_avg.y,
		type: 'scatter',
		line: {width: 1}
	};


	var volume_trace =
	{
		name: "Views",
		x: daily_views.x,
		y: daily_views.y,
		type: 'scatter',
		line: {width: 0, color: ('rgb(128,128,128)')},
		fill: 'tozeroy'
	};

	var layout = {

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

	var plot_spot = document.getElementById('plot');
	//var data = [short_moving_avg_trace,long_moving_avg_trace,volume_trace];
	var data = [short_moving_avg_trace,long_moving_avg_trace,volume_trace];

	Plotly.plot
	(
		plot_spot,
		data,
		layout,
		{displayModeBar: false}
	);

	var ret_arr = [average_views,views_last_week];
	return ret_arr;
	//return average_views;
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

function process_url(tablink)
{
	// if this will be a banner, don't add content
	if (tablink=="https://www.wikipedia.org" || tablink=="https://www.wikipedia.org/")
	{
		return;
	}

	// get the article name
	var article = tablink.split("/wiki/")[1];
	article = article.split("#")[0]; // remove extra in url specifying part of page to load to

	var article_pretty = article.split("_").join(" ").split("%27").join("\'").split("%E2%80%93").join("-");
	article_pretty = article_pretty.split("%C3%AD").join("í");
	article_pretty = article_pretty.split("%C3%A1").join("á");
	article_pretty = article_pretty.split("%C3%B8").join("ø");
	article_pretty = article_pretty.split("%C3%A9").join("é");
	article_pretty = article_pretty.split("%C3%97").join("x").split("%26").join("&");


	$("body").append("<div class=\"bg-text\">Popularity</div>");
	
	var views_arr = make_view_plot(article); // returns array with [avg_daily_views,views_last_week]
	var avg_daily_views = views_arr[0];
	var views_last_week = views_arr[1];

	var avg_daily_views_pretty = String(avg_daily_views.toLocaleString('en-US',{minimumFractionDigits: 2})).split(".")[0];
	var avg_daily_views_line = "<b>Average Views</b>&nbsp;&nbsp;"+avg_daily_views_pretty+" / day";
	$("body").append("<p>"+avg_daily_views_line+"</p>");

	// check if a trending article
	var rank = get_view_ranking(article);
	if (rank!=-1)
	{
		var trending_line = "<b>Trending</b> &nbsp;#"+String(rank)+" Yesterday";
		$("body").append("<p>"+trending_line+"</p>");
	}
}

function jQueryMain () {
	get_url(process_url);
}