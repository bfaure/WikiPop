
// Fetches remote data provided a url
function get_http_xml(url)
{
	var xml_http = new XMLHttpRequest();
	xml_http.open("GET",url,false);
	xml_http.send(null);
	return xml_http.responseText;
}

// get yesterday's date
var cur_date = new Date();
cur_date.setDate(cur_date.getDate()-1); 

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

// iterate through items and add elements to page
for (var i=0; i<data.items[0].articles.length; i++)
{
	var article_name = data.items[0].articles[i].article;
	var article_rank = data.items[0].articles[i].rank;
	var article_views = data.items[0].articles[i].views;
	var article_link = "https://en.wikipedia.org/wiki/"+article_name;

	var article_pretty = article_name.split("_").join(" ").split("%27").join("\'").split("%E2%80%93").join("-");
	article_pretty = article_pretty.split("%C3%AD").join("í");
	article_pretty = article_pretty.split("%C3%A1").join("á");
	article_pretty = article_pretty.split("%C3%B8").join("ø");
	article_pretty = article_pretty.split("%C3%A9").join("é");
	article_pretty = article_pretty.split("%C3%97").join("x").split("%26").join("&");

	var views_pretty = String(article_views.toLocaleString('en-US',{minimumFractionDigits: 2})).split(".")[0];

	$("body").append("<p>"+String(article_rank)+"  <a href=\""+article_link+"\" title=\"poop\">"+article_pretty+"</a>   ("+views_pretty+" Views yesterday)</p>");
}



