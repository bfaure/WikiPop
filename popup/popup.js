// global variables
var current_max_height="244px";
var is_minimized=false;


// low-level function to make a GET HTTPS request, returns response data
function get_http_xml(url)
{
	var xml_http = new XMLHttpRequest();
	xml_http.open("GET",url,false);
	xml_http.send(null);
	return xml_http.responseText;
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


function set_list_elems()
{
	var panel = document.getElementById("mw-panel");
	var panel_logo = panel.children[0];
	var first_panel_elem = panel.children[1];

	var new_panel_elem = document.createElement("div");
	new_panel_elem.className = "portal";
	new_panel_elem.role = "navigation";
	new_panel_elem.id = "wikiclassify-panel";

	var panel_header = document.createElement("h3");
	panel_header.id = "wikiclassify-panel-header";
	panel_header.innerHTML =  "WikiClassify";
	new_panel_elem.appendChild(panel_header);

	var panel_body = document.createElement("div");
	panel_body.className = "body";
	new_panel_elem.appendChild(panel_body);

	var panel_list = document.createElement("ul");
	panel_list.id = "wikipanel-list";
	panel_body.appendChild(panel_list);

	var panel_trending_entry = document.createElement("li");
	panel_list.appendChild(panel_trending_entry);

	var panel_trending_link = document.createElement("a");
	panel_trending_entry.appendChild(panel_trending_link);
	
	panel_trending_link.href = chrome.extension.getURL("popup/popular_articles.html");
	panel_trending_link.target = "_blank";
	panel_trending_link.innerText = "Trending Articles";

	panel.insertBefore(new_panel_elem,first_panel_elem);
}

function add_sizing_elems()
{
	var panel_list = document.getElementById("wikipanel-list");

	var expand_elem_entry = document.createElement("li");
	panel_list.appendChild(expand_elem_entry);

	var expand_link = document.createElement("a");

	expand_link.innerText = "Expand Frame";

	expand_link.onclick = function()
	{
		document.getElementById("wiki_frame").style.display = '';
		document.getElementById("wiki_frame").height=current_max_height;
	}

	expand_elem_entry.appendChild(expand_link);

	var hide_elem_entry = document.createElement("li");
	panel_list.appendChild(hide_elem_entry);

	var hide_link = document.createElement("a");
	hide_link.innerText = "Hide Frame";

	hide_link.onclick = function()
	{
		document.getElementById("wiki_frame").style.display = 'none';
	}
	hide_elem_entry.appendChild(hide_link);
}

// returns true if the current page isn't actually for an article (help, etc.)
function should_skip(url){
	// if this is not an article page, skip
	let built_ins=['Help:','Portal:','Wikipedia:','Special:',]
	for (let i=0; i<built_ins.length; i+=1){
		if (url.indexOf("/wiki/"+built_ins[i])!=-1){
			return true;
		}
	}
	if (url.indexOf("w/index.php")!=-1){
		return true;
	}
	if (url.indexOf("(disambiguation)")!=-1){
		return true;
	}
	return false;
}


// Used as the callback function for get_url, figures out if we should
// display the iFrame structure on the current webpage.
function process_url(url)
{

	// if this is the home page
	if (url=="https://www.wikipedia.org/" || url=="https://www.wikipedia.org")
	{
		return;
	}

  	chrome.storage.sync.get("enabled",function(obj){
    	if (obj["enabled"]=="true" || obj===null || obj["enabled"]==null)
    	{			
			// set the WikiClassify list elements in the left panel
			set_list_elems();

			// if this is the main page, skip
			if (url=="https://en.wikipedia.org/wiki/Main_Page")
			{
				return;
			}

			if (should_skip(url)){
				return;
			}

			var iframe_container = document.createElement("div");
			iframe_container.id = "wiki_frame_container";
			iframe_container.resize="both";
			iframe_container.overflow="auto";
			iframe_container.height="100%";

			// create iFrame element to insert later
			var iFrame = document.createElement("iframe");
			iFrame.id="wiki_frame";
			iFrame.resize="both";

			iframe_container.appendChild(iFrame);

			iFrame.src = chrome.extension.getURL("popup/popup_box.htm");
			iFrame.style = "border:1px solid #a6a6a6;margin-left:0.5em;transition:0.5s all";

			// width is set to match the width of the existing box on the article page
			iFrame.width = "280";
			iFrame.height = "244";

			iFrame.align = "right";
			add_sizing_elems();

			var insert_parent = document.getElementById("mw-content-text");
			var insert_spot = insert_parent.childNodes[0];
			insert_parent.insertBefore(iframe_container,insert_spot);
    	}
  	});
}

window.addEventListener("message",handleMessage,false);
function handleMessage(event){
	if (event.data=="minimize"){
		document.getElementById("wiki_frame").style.height="40px";
	}
	if (event.data=="maximize"){
		document.getElementById("wiki_frame").style.height=current_max_height;
	}
	if (event.data=="trending_resize"){
		document.getElementById("wiki_frame").style.height="273px";
		current_max_height="273px";
	}
	if (event.data=="imdb_resize"){
		let new_height=(parseInt(current_max_height.split("px")[0])+173).toString()+"px";
		document.getElementById("wiki_frame").style.height=new_height;
		current_max_height=new_height;
	}
	if (event.data=="goodreads_resize"){
		let new_height=(parseInt(current_max_height.split("px")[0])+89).toString()+"px";
		document.getElementById("wiki_frame").style.height=new_height;
		current_max_height=new_height;
	}
	if (event.data=="coin_resize"){
		let new_height=(parseInt(current_max_height.split("px")[0])+116).toString()+"px";
		document.getElementById("wiki_frame").style.height=new_height;
		current_max_height=new_height;
	}
}

// Call get_url function with the process_url function being called
// after get_url has called callback. The value provided to callback
// by get_url will be routed as the input to process_url
get_url(process_url);