var version='0.04';
//Some global variables needed
var data;
var saveData;

//Main function, grabs all data from xk3y and parses it
function getData() {
	$.ajax({
		type: "GET",
		url: "data.xml",
		dataType: "xml",
		cache: false,
		success: function(xml) {
			var dirs = [];
			var ISOlist = [];
			var drives = [];
			var about = [];
			var cache = [];
			var iso, id, par, dir, coversrc, isodata, cacheImage, active;
			//Array of HDDs
			$(xml).find('MOUNT').each(function() {
				drives.push($(this).attr('NAME'));
			});
			//Parse ISO data
			$(xml).find('ISO').each(function() {
				iso = $(this).find('TITLE').text().replace(/\.iso/gi,"");
				id = $(this).find('ID').text();
				par = $(this.parentNode).attr('NAME');
				coversrc = "covers/"+id+".jpg";
				isodata = { 
						"id" : id, 
						"name" : iso, 
						"image" : coversrc, 
						"par" : par };
				ISOlist.push(isodata);
				//Cache images
				//cacheImage = new Image();
				//cacheImage.src = "covers/"+id+".jpg";
				//cache.push(cacheImage);
			});
			//Directories
			$(xml).find('DIR').each(function() {
				dir = $(this).attr('NAME');
				par = $(this.parentNode).attr('NAME');
				dirs.push({"dir" : dir, "par" : par});
			});
			//About info
			$(xml).find('ABOUT').find('ITEM').each(function() {
				about.push({item: $(this).attr('NAME'), value: $(this).text()});
			});
			active=$(xml).find('ACTIVE').text();
			//Put everything into the data JSON object
			data = { 
				"dirs" : dirs, 
				"ISOlist" : ISOlist, 
				"drives" : drives, 
				"about" : about,
				"active" : active
			};
			//Serverside storage
			$.ajax({
				type: "GET",
				url: "store.sh",
				dataType: "json",
				cache: false,
				success: function(response) {
					if (response == null || response == "") {
						//Nothing saved yet? Make a new empty object
						saveData={};
					}
					else {
						//Else use the saved stats
						saveData=response;
					}
					//Init settings
					Settings.init();
					//Get the current page
					getCurrentPage();
				},
				error: function() {
					//Still make a new empty object, so we can still use it this session
					saveData={};
					//Init settings
					Settings.init();
					//Get the current page
					getCurrentPage();
				}
			});
		}
	});
}

function makeCoverWallPage() {
	//If the page isn't created yet, create it now
	if (!wallMade) {
		//Copy the ISOList! We don't want to mess up the other menus
		var ISOlist = data.ISOlist.slice();
		//Make it alpabetically listed
		ISOlist.sort(function(x,y) { 
			var a = String(x.name).toUpperCase(); 
			var b = String(y.name).toUpperCase(); 
			if (a > b) 
				return 1 
			if (a < b) 
				return -1 
			return 0; 
		});
		var iso, id, cover;
		var HTML='<br/>';
		var l=ISOlist.length;
		var cur=0;
		for (var i=0;i<l;i++) {
			iso = ISOlist[i].name;
			id = ISOlist[i].id;
			cover = ISOlist[i].image;
			HTML+='<a href="#details-page?'+id+'&'+escape(iso)+'"><div class="tile accent animate" style="background-image:url(\''+cover+'\'); background-size: 173px;"><span class="tile-title">'+iso+'</span></div></a>';
			cur++;
			/*if (cur == 2) {
				HTML+='<br/>';
				cur=0;
			}*/
		}
		document.getElementById('coverwallcontainer').innerHTML=HTML;
		//Trigger accentChange to make sure the tiles get the correct colors
		accentChange(saveData['Settings'].accent);
		wallMade=true;
		return;
	}
}

function makeListPage(args) {
	//If there are arguments and the page is created, we want to scroll to a letter
	if (args && listsMade) {
		scrollToLetter(args[1]);
		return;
	}
	else if (!listsMade) {
		//Copy the ISOList! We don't want to mess up the other menus
		var ISOlist = data.ISOlist.slice();
		//Make it alpabetically listed
		ISOlist.sort(function(x,y) { 
			var a = String(x.name).toUpperCase(); 
			var b = String(y.name).toUpperCase(); 
			if (a > b) 
				return 1 
			if (a < b) 
				return -1 
			return 0; 
		});
		var iso, id, cover, letter, activeClass;
		var lastLetter='';
		var active = data.active;
		var HTML='';
		var l=ISOlist.length;
		for (var i=0;i<l;i++) {
			iso = ISOlist[i].name;
			id = ISOlist[i].id;
			cover = ISOlist[i].image;
			letter = iso.charAt(0).toLowerCase();
			if (HTML.indexOf('list-divider-'+letter)==-1) {
				if (lastLetter!='' && lastLetter != letter) {
					HTML+='</div>';
				}
				HTML+='<a href="#overlay?black" onclick="openLetterOverlay()"><div class="scrollcontainer"><div class="list-item header" id="list-divider-'+letter+'"><div class="list-divider accent-text accent-border">'+letter+'</div></div></a>';
				lastLetter=letter;
			}
			activeClass='';
			if (id==active) {
				activeClass=' accent-text';
			}
			HTML+='<a href="#details-page?'+id+'&'+escape(iso)+'"><div class="list-item game '+id+'"><div class="list-item-icon accent" style="background-image:url(\''+cover+'\'); background-size: 72px;"></div><span class="list-item-text'+activeClass+'">'+iso+'</span></div></a>';
		}
		HTML+='<br/>';
		//Native approach should be faster
		document.getElementById('listcontainer').innerHTML=HTML;
		$(".easydate").easydate();
		listsMade=true;
		//Trigger accentChange to make sure the list gets the correct colors
		accentChange(saveData['Settings'].accent);
		//If we had arguments upon creation, scroll to the argument
		if (args) {
			scrollToLetter(args[1]);
		}
		return;
	}
}

function makeFolderStructurePage(args) {
	//If there are arguments and the page is created, we are requesting a folder
	if (args && foldersMade) {
		showPage(args[1]);
		return;
	}
	if (!foldersMade) {
		var dir, dirID, par, par1, chk, id, name, cover, activeClass, HTML;
		var active=data.active;
		//Create directories first
		var l = data.dirs.length;
		for (var i=0; i<l; i++) {
			dir = escape(data.dirs[i].dir);
			par = data.dirs[i].par;
			chk = data.drives.toString().indexOf(par);
			//What if the parent directory is a HDD? Make it the content block
			if ($('div#'+dir+'-dir').length==0) {
				//Create a new page
				HTML='<div id="'+dir+'-dir" class="page"><div class="spacer"></div><div class="spacer"></div><span class="page-title">'+unescape(dir)+'</span><br/><br/></div>';
				document.getElementById('main').innerHTML+=HTML;
				//Register new page with empty function
				pages[dir+'-dir']=function(){};
			}
			if (chk!=-1) {
				par1 = 'folderstructurecontainer';
			}
			else {
				par1 = par+"-dir";
				par1 = escape(par1);
			}
			if (!document.getElementById(dir)) {
				HTML='<a href="#folderstructure-page?'+dir+'-dir"><div class="tile accent" style="background-image:url(\'img/folder.png\'); background-size: 173px;"><span class="tile-title">'+unescape(dir)+'</span></div></a>';
				document.getElementById(par1).innerHTML+=HTML;
			}
		}
		//Then the ISOs
		var l = data.ISOlist.length;
		for (var i=0; i<l; i++) {
			id = data.ISOlist[i].id;
			name = data.ISOlist[i].name;
			par = escape(data.ISOlist[i].par);
			cover = data.ISOlist[i].image;
			chk = data.drives.toString().indexOf(par);
			//Same parent fix as with directories
			if (chk!=-1) {
				par1 = 'folderstructurecontainer';
			}
			else {
				par1 = par+"-dir";
			}
			activeClass='';
			//If game is active, highlight it
			if (id==active) {
				activeClass=' class="activeGame"';
			}
			HTML='<a href="#details-page?'+id+'&'+escape(name)+'"><div class="tile accent animate" style="background-image:url(\''+cover+'\'); background-size: 173px;"><span class="tile-title">'+name+'</span></div></a>';
			document.getElementById(par1).innerHTML+=HTML;
		};
		foldersMade=true;
		accentChange(saveData['Settings'].accent);
		//If we had arguments, it means a directory was requested upon creation; show the directory page
		if (args) {
			showPage(args[1]);
		}
		return;
	}
}

function makeFavoritesPage() {
	return false;
}

function makeSearchPage() {
	//Ugly fix for text input width
	$('.searchinput').css('width', $(window).width()-66+'px');
}

function makeAboutPage() {
	var HTML='';
	for (var i=0; i<data.about.length; i++) {
		HTML += data.about[i].item+': '+data.about[i].value+'<br/>';
	}
	document.getElementById('xk3y-about').innerHTML=HTML;
	document.getElementById('version').innerHTML=version;
}

function makeOverlay(args) {
	if (args[1]=='grey') {
		$(args[0]).css('background-color','#181C18');
	}
	else if (args[1]=='black') {
		$(args[0]).css('background-color','');
	}
}

function prepDetails(id, name) {
	//If name arg is empty, we came from showPage, parse the id variable
	if (!name) {
		var tmp=id[1].split('&',2);
		id = tmp[0];
		name = tmp[1];
	}
	var url = 'covers/'+id+'.xml';
	document.getElementById('details-page').innerHTML='';
	var title, summary, HTML;
	$.ajax({
		type: "GET",
		url: url,
		dataType: "xml",
		cache: false,
		success: function(xml) {
			if ($(xml).find('title').text()=="No Title") {
				title = unescape(name);
			}
			else {
				title = $(xml).find('title').text();
			}
			summary = $(xml).find('summary').text();
			HTML='<div class="spacer"></div><div class="spacer"></div><span class="page-title">'+title+'</span><br/><br/><div class="page-wrapper">';
			HTML+='<img class="details-cover" src="covers/'+id+'.jpg"/>'+summary+'<div class="details-button-pane">';
			HTML+='<a class="button" href="javascript:launchGame(\''+id+'\');">Play</a>';
			HTML+='<a class="button" href="javascript:history.back();">Close</a>';
			HTML+='<a class="button" href="javascript:pinToMain(\''+id+'\', \''+name+'\');">Pin to start</a>';
			HTML+='<a class="button" href="javascript:history.back();">Add to favorites</a>';
			HTML+='</div></div>';
			document.getElementById('details-page').innerHTML=HTML;
		},
		error: function() {
			title=unescape(name);
			summary="Betrayed by the ruling families of Italy, a young man embarks upon an epic quest for vengeance. To eradicate corruption and restore his family's honor, he will study the secrets of an ancient Codex, written by Alta�r. To his allies, he will become a force for change - fighting for freedom and justice. To his enemies, he will become a dark knight - dedicated to the destruction of the tyrants abusing the people of Italy. His name is Ezio Auditore da Firenze. He is an Assassin."
			HTML='<div class="spacer"></div><div class="spacer"></div><span class="page-title">'+title+'</span><br/><br/><div class="page-wrapper">';
			HTML+='<img class="details-cover" src="img/test.jpg"/>'+summary+'<div class="details-button-pane">';
			HTML+='<a class="button" href="javascript:launchGame(\''+id+'\');">Play</a>';
			HTML+='<a class="button" href="javascript:history.back();">Close</a>';
			HTML+='<a class="button" href="javascript:pinToMain(\''+id+'\', \''+name+'\');">Pin to start</a>';
			HTML+='<a class="button" href="javascript:history.back();">Add to favorites</a>';
			HTML+='</div></div>';
			document.getElementById('details-page').innerHTML=HTML;
		}
	});
	scrollUp();
}

function launchGame(id) {
	var url = "launchgame.sh?"+id;
	$.ajax({
		type: "GET",
		url: "data.xml",
		dataType: "xml",
		cache: false,
		success: function(xml) {
			var tray = $(xml).find('TRAYSTATE').text();
			var guistate = $(xml).find("GUISTATE").text();
			if (tray == 0) {
				$.get(url);
				updateActive(id);
            }
			else if (tray == 1 && guistate == 1) {
				MessageBox.Show('Loading Notification', 'Please open your DVD tray.');
				$.get(url);
				updateActive(id);
			}
			else if (tray == 1 && guistate == 2) {
				MessageBox.Show('Loading Notification', 'A game appears to be already loaded, please open your DVD tray and click "Reload"', '<a class="button" href="javascript:MessageBox.Close();launchGame(\''+id+'\')">Reload</a>');
			}
		}
	});
}