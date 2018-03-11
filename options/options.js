// Saves options to chrome.storage.sync.
function save_options() {
  var cat_idx = document.getElementById('Category').value;

  chrome.storage.sync.set({"category":cat_idx},function(){
    console.log("Options saved.");
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.

  document.getElementById("Category").value = "0";
  chrome.storage.sync.get("category",function(data){
    console.log("data",data.category);
    document.getElementById("Category").value=data.category;
  });

}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);