// Saves options to chrome.storage.sync.
function save_options() {

  // parse options from page...
  var is_enabled=document.getElementById("enable_checkbox").checked;

  if (is_enabled==true)
  {
    chrome.storage.sync.set({"enabled":"true"},function(){
      console.log("saved enable setting");
    });
  }
  else
  {
    chrome.storage.sync.set({"enabled":"false"},function(){
      console.log("saved disable setting");
    }); 
  }
}


function restore_options() {
  
  // Loading all data from localStorage...
  chrome.storage.sync.get("enabled",function(data){
    is_enabled=data["enabled"];
    console.log(data);
    console.log(is_enabled);
    if (is_enabled=="true")
    {
      document.getElementById("enable_checkbox").checked=true;
    }
    else
    {
      document.getElementById("enable_checkbox").checked=false;
      if (is_enabled===null)
      {
        chrome.storage.sync.set({"enabled":"true"},function(){
          console.log("saved setting");
        });
      }
    }
  });

}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);