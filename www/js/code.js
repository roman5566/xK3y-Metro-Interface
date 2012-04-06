var version='0.02';
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
			HTML+='<a href="#details-page?'+id+'&'+escape(iso)+'"><div class="tile accent" style="background-image:url(\''+cover+'\'); background-size: 173px;"><span class="tile-title">'+iso+'</span></div></a>';
			cur++;
			/*if (cur == 2) {
				HTML+='<br/>';
				cur=0;
			}*/
		}
		document.getElementById('coverwallcontainer').innerHTML=HTML;
		//Trigger accentChange to make sure the list gets the correct colors
		accentChange(saveData['Settings'].accent);
		wallMade=true;
	}
}

function makeListPage(args) {
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
		var HTML='<div class="page-wrapper"><div class="spacer"></div><div class="spacer"></div><span class="page-title">list</span></div>';
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
		HTML+='</div><br/>';
		//Native approach should be faster
		document.getElementById('list-page').innerHTML=HTML;
		listsMade=true;
		//Trigger accentChange to make sure the list gets the correct colors
		accentChange(saveData['Settings'].accent);
		if (args) {
			scrollToLetter(args[1]);
		}
		return;
	}
}

function makeFolderStructurePage(args) {
	if (args && foldersMade) {
		showPage(args[1]);
		return;
	}
	if (!foldersMade) {
		var dir, dirID, par, par1, chk, id, name, cover, activeClass;
		var active=data.active;
		//Create directories first
		var l = data.dirs.length;
		for (var i=0; i<l; i++) {
			dir = escape(data.dirs[i].dir);
			par = data.dirs[i].par;
			chk = data.drives.toString().indexOf(par);
			//What if the parent directory is a HDD? Make it the content block
			if ($('div#'+dir+'-dir').length==0) {
				$('<div id="'+dir+'-dir" class="page"></div>').html('<div class="spacer"></div><div class="spacer"></div><span class="page-title">'+unescape(dir)+'</span><br/><br/>').appendTo(document.getElementById('main'));
			}
			if (chk!=-1) {
				par1 = 'folderstructurecontainer';
			}
			else {
				par1 = par+"-dir";
				par1 = escape(par1);
			}
			if (!document.getElementById(dir)) {
				$('<a href="#folderstructure-page?'+dir+'-dir" id="'+dir+'">').html('<div class="tile accent" style="background-image:url(\'img/folder.png\'); background-size: 173px;"><span class="tile-title">'+unescape(dir)+'</span></div>').appendTo(document.getElementById(par1));
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
			if (id==active) {
				activeClass=' class="activeGame"';
			}
			$('<a href="#details-page?'+id+'&'+escape(name)+'">').html('<div class="tile accent" style="background-image:url(\''+cover+'\'); background-size: 173px;"><span class="tile-title">'+name+'</span></div>').appendTo(document.getElementById(par1));
		};
		foldersMade=true;
		if (args) {
			showPage(args[1]);
		}
	}
}

function makeFavoritesPage() {
	return false;
}

function makeSearchPage() {
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
	if (!name) {
		var tmp=id[1].split('&',2);
		id = tmp[0];
		name = tmp[1];
	}
	var url = 'covers/'+id+'.xml';
	$.ajax({
		type: "GET",
		url: url,
		dataType: "xml",
		cache: false,
		success: function(xml) {
			//Prepare title HTML
			var title;
			if ($(xml).find('title').text()=="No Title") title = unescape(name);
			else title = $(xml).find('title').text();
			var summary = $(xml).find('summary').text();
			var HTML='<div class="spacer"></div><div class="spacer"></div><span class="page-title">'+title+'</span><br/><div class="page-wrapper"><br/><img class="details-cover" src="covers/'+id+'.jpg"/>'+summary+'<div class="details-button-pane"><a class="button" href="javascript:launchGame(\''+id+'\');" style="float:left">Play</a><a class="button" href="javascript:history.back();" style="float:right">Close</a></div></div>';
			document.getElementById('details-page').innerHTML=HTML;
		},
		error: function() {
			var summary="Betrayed by the ruling families of Italy, a young man embarks upon an epic quest for vengeance. To eradicate corruption and restore his family's honor, he will study the secrets of an ancient Codex, written by Altaïr. To his allies, he will become a force for change - fighting for freedom and justice. To his enemies, he will become a dark knight - dedicated to the destruction of the tyrants abusing the people of Italy. His name is Ezio Auditore da Firenze. He is an Assassin."
			var HTML='<div class="spacer"></div><div class="spacer"></div><span class="page-title">'+name+'</span><br/><div class="page-wrapper"><br/><img class="details-cover" src="img/test.jpg"/>'+summary+'<div class="details-button-pane"><a class="button" href="javascript:launchGame(\''+id+'\');" style="float:left">Play</a><a class="button" href="javascript:history.back();" style="float:right">Close</a></div></div>';
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