/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
//deviceready
var app_swiper, search_swiper, account_swiper, user_swiper, player, 
	ytAjax=false, playlist="", playlist_musics=[], currentPlaylist=[], music_id="", music_title="", music_img="", ul_id="",
	music_duration="", addToFavoritesList=[], live_player_active=false, live_u_name;

/* Youtube JS */
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

/* Vanilla Ajax */
function vanillaAjax(options, func){
	if(ytAjax) ytAjax.abort();
	ytAjax = new XMLHttpRequest();
	ytAjax.open("POST", options.url, true);
	ytAjax.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	ytAjax.onreadystatechange = function(){
		if(ytAjax.readyState != 4 || ytAjax.status != 200) return;
		(options.dataType && options.dataType=="JSON")? func(JSON.parse(ytAjax.responseText)):func(ytAjax.responseText);
	};
	if(options.beforeSend) options.beforeSend();
	ytAjax.send(options.data);
}

/* Return time formated */
function fancyTimeFormat(time){
	var hrs = ~~(time/3600);
	var mins = ~~((time%3600)/60);
	var secs = time % 60;
	var ret = "";
	if(hrs>0) ret += ""+hrs+":"+(mins<10? "0":"");
	ret += ""+mins+":"+(secs<10? "0":"");
	ret += ""+secs;
	return ret;
}

/* Update music progress bar */
function updateBar(){
	if(player){
		if(player.getPlayerState()==1){
			var playerTime		= (player.getCurrentTime()*100)/player.getDuration();
			document.getElementsByClassName("playerViewed")[0].style.width	= playerTime+"%";
			document.getElementsByClassName("playerProgressTime")[0].innerHTML	= fancyTimeFormat(player.getCurrentTime().toFixed(0));
			setTimeout(updateBar, 500);
		}
	}
}

/* get element */
function $(el){
	if(typeof el==='object') return el;
	if(!(this instanceof $)) return new $(el);
	return (el.substr(0,1)=="#")? document.getElementById(el.substring(1)):document.getElementsByClassName(el.substring(1));
}

function onYouTubeIframeAPIReady(){
	player = new YT.Player('player_yt', {
		height: '0',
		width: '0',
		playerVars: {autoplay:1, rel:0, showinfo:0},
		events: {
			'onReady': function(event){
				event.target.stopVideo();
			},
			'onStateChange': function(event){
			
				if(player.getPlayerState()==1){
					document.getElementsByClassName("pause_player")[0].style.display	= "none";
					document.getElementsByClassName("play_player")[0].style.display		= "block";
					updateBar();
				}else{
					document.getElementsByClassName("pause_player")[0].style.display	= "block";
					document.getElementsByClassName("play_player")[0].style.display		= "none";
				}
				
				if(event.data===YT.PlayerState.CUED){
					playlist_musics 		= player.getPlaylist();
					currentPlaylist			= [];
					
					if(playlist_musics && playlist_musics.length>0){
						vanillaAjax({
							url:"http://youoff.me/posts/",
							data:"playlist="+playlist+
								"&ul_id="+ul_id+
								"&add_video_log_u_id="+window.localStorage.u_id+
								"&add_video_log_title="+music_title+
								"&add_video_log_music_id="+music_id+
								"&add_video_log_videoimg="+music_img,
							dataType:"JSON"
						}, function(data){
							if(data.statistics){
								if(data.statistics[0].liked){
									$("#like_in_player").className			= "playerStatistics_active";
									like_in_player.setAttribute("data-pl_id", data.statistics[0].favorited);
								}
								if(data.statistics[0].favorited){
									favorite_in_player.className			= "playerStatistics_active";
									favorite_in_player.setAttribute("data-pf_id", data.statistics[0].favorited);
								}
								if(data.statistics[0].added>0){
									add_in_player.className					= "playerStatistics_active";
									add_in_player.setAttribute("data-pa_id", data.statistics[0].added);
								}
								$("#playerStatistics_likes").innerHTML		= data.statistics[0].likes;
								$("#playerStatistics_comments").innerHTML	= data.statistics[0].comments;
								$("#playerStatistics_favorites").innerHTML	= data.statistics[0].favorites;
								$("#playerStatistics_shares").innerHTML		= data.statistics[0].added;
								$("#playerStatistics_added").innerHTML		= data.statistics[0].added;
							}
							
							$(".playerMusicList")[0].innerHTML		= "";
							$(".playerMusicList")[1].innerHTML		= "";
							if(data.videos){
								for(var i=0;i<data.videos.length;i++){
									if(data.videos[i].title){
										currentPlaylist.push(data.videos[i].videoId);
										$(".playerMusicList")[0].innerHTML	+= '<li class="active playlistIndex" data-playlist="'+String(playlist)+'" data-title="'+String(data.videos[i].title)+'" data-thumb="'+String(data.videos[i].thumb)+'" data-videoid="'+String(data.videos[i].videoId)+'" data-index="'+i+'" '+(music_id==data.videos[i].videoId? "style='background:#171717!important'":"")+' >'+
																				data.videos[i].title.substring(0, 25)+'..'+
																				'<span>'+
																					String(data.videos[i].duration)+
																					'<i class="material-icons">&#xE5D4;</i>'+
																				'</span>'+
																			'</li>';
									}
								}
							}
							
							if(data.comments_on_live){
								if(data.comments_on_live[0]){
									$("#save_live_playlist_to_favorites").className	= (data.comments_on_live[0].favorited)? "icon_on":"love_off";
									$("#playlist_watchers_count_live").innerHTML	= data.comments_on_live[0].watchers;
								} 
								for(var i=0;i<data.comments_on_live.length;i++){
									$("#live_comments_ul").innerHTML	+= '<li>'+
																				'<img class="userImage" src="'+data.comments_on_live[i].u_img+'" alt="">'+
																				'<span>'+
																					'<b>'+data.comments_on_live[i].name+'</b><br>'+
																					data.comments_on_live[i].ulc_text+
																				'</span>'+
																			'</li>';
								}
							}
							
							getIndexFromMusic		= (music_id!=null)? currentPlaylist.indexOf(music_id):0;
							player.loadPlaylist({playlist:currentPlaylist, index:getIndexFromMusic, suggestedQuality:'small'});
						});
					}
				}
			},
			'onError': function(event){
				if(event.data=="150" || event.data=="101"){
					alert("O proprietário do vídeo solicitado não permite que ele seja reproduzido em players incorporados.");
				}
			}
		}
	});
}

function startAPP(){
	
	/* Check connection */
	function checkConnection(){
		return (navigator.onLine!=='none')? true:false;
	}
	
	/* Add class */
	function addClass(elements, myClass){
		if(!elements) { return; }
		if(typeof(elements) === 'string'){
			elements = document.querySelectorAll(elements);
		}else if(elements.tagName){ elements=[elements]; }
		for(var i=0;i<elements.length;i++){
			elements[i].classList.add(myClass);
		}
	}
	
	/* Remove class */
	function removeClass(elements, myClass){
		if(!elements) { return; }
		if(typeof(elements) === 'string'){
			elements = document.querySelectorAll(elements);
		}else if(elements.tagName){ elements=[elements]; }
		for(var i=0;i<elements.length;i++){
			elements[i].classList.remove(myClass);
		}
	}
	
	/* Toggle class */
	function toggleClass(elements, myClass){
		if(!elements) { return; }
		if(typeof(elements) === 'string'){
			elements = document.querySelectorAll(elements);
		}else if(elements.tagName){ elements=[elements]; }
		for(var i=0;i<elements.length;i++){
			elements[i].classList.toggle(myClass);
		}
	}
	
	/* Return true if in array */
	Array.prototype.in_array = function(a){
		for(var i=0,l=this.length;i<l;i++){
		    if(this[i]==a) return true;
		}
		return false;
	}
	
	/* Return index of element */
	function index(element){
		var sib	= element.parentNode.childNodes;
		var n	= 0;
		for(var i=0; i<sib.length; i++){
			if(sib[i]==element) return n;
			if(sib[i].nodeType==1) n++;
		}
		return -1;
	}
	
	/* Fade in and fade out */
	$.prototype.fade = function fade(type, ms){
		var isIn	= type==='in',
		opacity		= isIn? 0:1,
		interval	= 50,
		duration	= ms,
		gap			= interval/duration,
		self		= this;
		if(isIn){
			self.el.style.display = 'inline';
			self.el.style.opacity = opacity;
		}
		function func(){
			opacity = isIn? opacity+gap:opacity-gap;
			self.el.style.opacity = opacity;
			if(opacity <= 0) self.el.style.display = 'none';
			if(opacity <= 0 || opacity >= 1) window.clearInterval(fading);
		}
		var fading = window.setInterval(func, interval);
	}
	
	/* Time to difference */
	function timeToDifference(time){
		var thisTime	= new Date(time);
		var nowDate		= new Date();
		var diffYears	= parseInt((nowDate-thisTime)/(1000*60*60*24*30*12));
		var diffMonths	= parseInt((nowDate-thisTime)/(1000*60*60*24*30));
		var diffDays	= parseInt((nowDate-thisTime)/(1000*60*60*24));
		var diffHours	= parseInt((nowDate-thisTime)/(1000*60*60));
		var diffMinutes	= parseInt((nowDate-thisTime)/(1000*60));
		var diffSeconds	= parseInt((nowDate-thisTime)/(1000));
		var difText		= (diffSeconds<60)? diffSeconds+"s":diffMinutes+"m";
			difText		= (diffMinutes<60)? difText:diffHours+"h";
			difText		= (diffHours<24)? difText:diffDays+"d";
			difText		= (diffDays<30)? difText:diffMonths+" mês(es)";
			difText		= (diffMonths<12)? difText:diffYears+" ano(s)";
		return difText;
	}
	
	user_swiper = new Swiper('.user_swiper', {
		pagination:false,
		spaceBetween: 30,
		hashnav: true,
		hashnavWatchState:true
	});

	account_swiper = new Swiper('.account_swiper', {
		pagination:false,
		spaceBetween: 30,
		hashnav: true,
		hashnavWatchState:true
	});

	search_swiper = new Swiper('.search_swiper', {
		pagination:false,
		spaceBetween: 30,
		hashnav: true,
		hashnavWatchState:true,
		onTap: function(swiper, event){
			classes				= event.target.className.split(" "),
			parentClasses		= event.target.parentNode.className.split(" "),
			parentParentClasses	= event.target.parentNode.parentNode.className.split(" ");
			if(classes.in_array("musicItem") || classes.in_array("playlistItem")){
				music_title				= event.target.getAttribute("data-title");
				music_duration			= event.target.getAttribute("data-duration");
				music_id				= event.target.getAttribute("data-videoid");
				music_img				= event.target.getAttribute("data-thumb");
				playlist				= event.target.getAttribute("data-playlist");
				document.location.hash	= "#player&playlist="+playlist+"&title="+music_title+"&img="+music_img;
			}
			
			if(classes.in_array("userItem") || parentClasses.in_array("userItem") || parentParentClasses.in_array("userItem")){
				thisTarget	= (classes.in_array("userItem"))? event.target:event.target.parentNode;
				if(parentParentClasses){
					thisTarget	= (parentParentClasses.in_array("userItem"))? event.parentNode.parentNode:thisTarget;
				}
				if(thisTarget.getAttribute("data-uid")==window.localStorage.u_id){
					document.location.hash	= "#my_account";
				}else{
					$("#user_name").innerHTML			= thisTarget.getAttribute("data-name");
					$("#user_subscribers").innerHTML	= thisTarget.getAttribute("data-subscribers");
					$("#user_img_").src					= thisTarget.getAttribute("data-thumb");
					$(".followButton")[0].setAttribute("data-u_id", thisTarget.getAttribute("data-uid"));
					document.location.hash	= "#user_page&u_id="+thisTarget.getAttribute("data-uid");
				}
			}
		}
	});
	
	/*
	app_swiper = new Swiper('.app_swiper', {
		pagination:false,
		spaceBetween: 30,
		hashnav: true,
		onTransitionEnd: function(swipe){
			if(swipe.activeIndex!=4) if(player) if(player.stopVideo) player.stopVideo();
			setTimeout(function(){
				app_swiper.onResize();
			}, 50);
		}
	});
	*/
	
	function loadNotifications(){
		vanillaAjax({
			url:"http://youoff.me/posts/",
			data:"get_notifications="+window.localStorage.u_id,
			dataType:"JSON",
			beforeSend:function(){
				$("#notifyFeed_ul").innerHTML	= "<img src='img/loading.svg' style='width:45px;display:table;margin-top:25px;margin-left:auto;margin-right:auto' alt=''>";
			}
		}, function(data){
			$("#notifyFeed_ul").innerHTML	= "";
			if(data.length>0){
				for(var i=0;i<data.length;i++){
					if(data[i].array_type=="followers"){
						$("#notifyFeed_ul").innerHTML	+=	'<li>'+
															'<a href="#user_page&u_id='+data[i].u_id+'">'+
																'<img class="userImage" src="'+data[i].u_img+'" alt="">'+
															'</a>'+
															'<span class="userName"><a href="#user_page&u_id='+data[i].u_id+'">'+data[i].name+'</a></span>'+
															'<span>'+
																'começou a seguir você'+
															'</span>'+
															'<span class="feedTime">'+timeToDifference(Number(data[i].time)*1000)+'</span>'+
														'</li>';
					}
					
					if(data[i].array_type=="added_my_playlists"){
						$("#notifyFeed_ul").innerHTML	+=	'<li class="playlistItem" data-u_name="'+data[i].name+'" data-title="'+data[i].p_name+'" data-playlist="'+data[i].pa_playlist_id+'" data-thumb="'+data[i].pw_playlist_img+'">'+
															'<a href="#user_page">'+
																'<img class="userImage" src="'+data[i].u_img+'" alt="">'+
															'</a>'+
															'<span class="userName"><a href="#user_page">'+data[i].name+'</a></span>'+
															'<span>'+
																'adicionou sua playlist<br>'+
																'<a>'+data[i].p_name+'</a>'+
															'</span>'+
															'<span class="feedTime">'+timeToDifference(Number(data[i].time)*1000)+'</span>'+
														'</li>';
					}
				}
			}
		});
	}
	
	function loadAccountFeed(id, url, u_id){
		$(".followButton")[0].innerHTML	= "seguir";
		vanillaAjax({
			url:"http://youoff.me/posts/",
			data:"get_user_feed="+u_id+"&u_id="+window.localStorage.u_id,
			dataType:"JSON",
			beforeSend:function(){
				if(url=="user_page"){
					$(".followButton")[0].setAttribute("data-u_id", u_id);
					$("#user_img_").setAttribute("src", "img/user.jpg");
				}
				$("#"+id+"_feed").innerHTML	= "<img src='img/loading.svg' style='width:45px;display:table;margin-top:25px;margin-left:auto;margin-right:auto' alt=''>";
				$("#"+id+"_playlists").innerHTML	= "<img src='img/loading.svg' style='width:45px;display:table;margin-top:25px;margin-left:auto;margin-right:auto' alt=''>";
				$("#"+id+"_favorites").innerHTML	= "<img src='img/loading.svg' style='width:45px;display:table;margin-top:25px;margin-left:auto;margin-right:auto' alt=''>";
			}
		}, function(data){
			if(data.info){
				$("#"+id+"_feed").innerHTML			= "";
				$("#"+id+"_playlists").innerHTML	= "";
				$("#"+id+"_favorites").innerHTML	= "";
				if(data.info[0]){
					$("#user_name").innerHTML			= data.info[0].name;
					$("#user_subscribers").innerHTML	= data.info[0].subscribers;
					$("#user_img_").setAttribute("src", data.info[0].u_img);
					$(".current_user_follows")[0].innerHTML	= data.info[0].follows;
					$(".current_user_subscribers")[0].innerHTML	= data.info[0].subscribers;
					$(".current_user_subscribers")[1].innerHTML	= data.info[0].subscribers;
					
					if(data.info[0].following>0){
						$(".followButton")[0].innerHTML	= "deixar de seguir";
					}
				}
				for(var i=0;i<data.history.length;i++){
					$("#"+id+"_feed").innerHTML	+= '<li class="playlistItem" data-title="'+data.history[i].pw_playlist_name+'" data-playlist="'+data.history[i].pw_playlist_id+'" data-thumb="'+data.history[i].pw_playlist_img+'">'+
														'<a class="playlistItem" data-title="'+data.history[i].pw_playlist_name+'" data-playlist="'+data.history[i].pw_playlist_id+'" data-thumb="'+data.history[i].pw_playlist_img+'">'+
															'<img class="userImage" src="'+data.history[i].u_img+'" alt="">'+
														'</a>'+
														'<span class="playlistItem" data-title="'+data.history[i].pw_playlist_name+'" data-playlist="'+data.history[i].pw_playlist_id+'" data-thumb="'+data.history[i].pw_playlist_img+'">'+
															'está ouvindo a playlist <a>'+data.history[i].pw_playlist_name+'</a>'+
														'</span>'+
														'<span class="feedTime">'+timeToDifference(Number(data.history[i].pw_time)*1000)+'</span>'+
													'</li>';
				}
				
				for(var i=0;i<data.playlists.length;i++){
					$("#"+id+"_playlists").innerHTML	+= '<li class="live_u_name playlistItem" data-u_name="'+data.playlists[i].u_name+'" data-title="'+data.playlists[i].p_name+'" data-playlist="'+data.playlists[i].p_playlist_id+'" data-thumb="'+data.playlists[i].p_playlist_img+'">'+
																'<a class="live_u_name playlistItem" data-u_name="'+data.playlists[i].u_name+'" data-title="'+data.playlists[i].p_name+'" data-playlist="'+data.playlists[i].p_playlist_id+'" data-thumb="'+data.playlists[i].p_playlist_img+'">'+
																	'<div class="favoriteThumb">'+
																		'<img src="'+data.playlists[i].p_playlist_img+'" alt="">'+
																	'</div>'+
																'</a>'+
																'<span class="favoriteName live_u_name playlistItem" data-u_name="'+data.playlists[i].u_name+'" data-title="'+data.playlists[i].p_name+'" data-playlist="'+data.playlists[i].p_playlist_id+'" data-thumb="'+data.playlists[i].p_playlist_img+'">'+
																	data.playlists[i].p_name+"<br><span style='font-size:12px!important'>"+data.playlists[i].views+' visualizações</span>'+
																'</span>'+
																'<!--<span class="addFavorite" data-videoimg="'+data.playlists[i].p_playlist_img+'" data-videoname="'+data.playlists[i].p_name+'" data-videoid="'+data.playlists[i].p_playlist_id+'">'+
																	'<i class="fa fa-check"></i>'+
																	'Adicionado'+
																'</span>-->'+
															'</li>';
				}
				
				for(var i=0;i<data.favorites.length;i++){
					$("#"+id+"_favorites").innerHTML	+= '<li>'+
																'<a class="playlistItem" data-title="'+data.favorites[i].pw_playlist_name+'" data-playlist="'+data.favorites[i].playlist_id+'" data-thumb="'+data.favorites[i].pw_playlist_img+'">'+
																	'<div class="favoriteThumb">'+
																		'<img src="'+data.favorites[i].pw_playlist_img+'" alt="">'+
																	'</div>'+
																'</a>'+
																'<span class="favoriteName playlistItem" data-title="'+data.favorites[i].pw_playlist_name+'" data-playlist="'+data.favorites[i].playlist_id+'" data-thumb="'+data.favorites[i].pw_playlist_img+'">'+
																	'<a>'+
																		data.favorites[i].pw_playlist_name+
																	'</a>'+
																'</span>'+
																'<span>'+
																//data.favorites[i].views+' visualizações'+
																'</span>'+
																'<span class="addFavorite" data-videoimg="'+data.favorites[i].pw_playlist_img+'" data-videoname="'+data.favorites[i].pw_playlist_name+'" data-videoid="'+data.favorites[i].playlist_id+'">'+
																	'<i class="fa fa-check"></i>'+
																	'Adicionado'+
																'</span>'+
															'</li>';
				}
			}
		});
	}
	
	function loadFeed(){
		$("#feed_ul").innerHTML	= "<img src='img/loading.svg' style='width:45px;display:table;margin-top:25px;margin-left:auto;margin-right:auto' alt=''>";
		vanillaAjax({
			url:"http://youoff.me/posts/",
			data:"get_feed=1",
			dataType:"JSON"
		}, function(data){
			if(data.video_live){
				document.getElementById("feed_live").innerHTML	= "";
				if(data.video_live.length>0){
					for(var i=0;i<data.video_live.length;i++){
						
						document.getElementById("feed_live").innerHTML	+= '<li class="musicItemLive" data-ul_id="'+data.video_live[i].ul_id+'" data-u_name="'+data.video_live[i].name+'" data-u_id_img="'+data.video_live[i].img+'" data-title="'+data.video_live[i].ul_videoname+'" data-playlist="'+data.video_live[i].ul_playlist_id+'" data-videoid="'+data.video_live[i].ul_video_id+'" data-thumb="'+data.video_live[i].ul_videoimg+'">'+
																				'<a>'+
																					'<img class="userImage" src="'+data.video_live[i].img+'" alt="">'+
																					'<span>'+data.video_live[i].name.substr(0, 10)+'..</span>'+
																				'</a>'+
																			'</li>';
					}
				}
			}
		
			if(data.video_log){
				document.getElementById("feed_ul").innerHTML	= "";
				if(data.video_log.length>0){
					for(var i=0;i<data.video_log.length;i++){
						document.getElementById("feed_ul").innerHTML	+= '<li>'+
																				'<a class="playlistItem" data-u_name="'+data.video_log[i].name+'" data-title="'+data.video_log[i].pw_playlist_name+'" data-playlist="'+data.video_log[i].pw_playlist_id+'" data-thumb="'+data.video_log[i].playlist_img+'">'+
																					'<img class="userImage" src="'+data.video_log[i].img+'" alt="">'+
																				'</a>'+
																				'<span class="userName">'+
																					'<a class="playlistItem" data-u_name="'+data.video_log[i].name+'" data-title="'+data.video_log[i].pw_playlist_name+'" data-playlist="'+data.video_log[i].pw_playlist_id+'" data-thumb="'+data.video_log[i].playlist_img+'">'+data.video_log[i].name+'</a>'+
																				'</span>'+
																				'<span class="user_listening playlistItem" data-u_name="'+data.video_log[i].name+'" data-title="'+data.video_log[i].pw_playlist_name+'" data-playlist="'+data.video_log[i].pw_playlist_id+'" data-thumb="'+data.video_log[i].playlist_img+'">'+
																					'está ouvindo a playlist <a class="playlistItem" data-u_name="'+data.video_log[i].name+'" data-title="'+data.video_log[i].pw_playlist_name+'" data-playlist="'+data.video_log[i].pw_playlist_id+'" data-thumb="'+data.video_log[i].playlist_img+'">'+data.video_log[i].pw_playlist_name+'</a>'+((data.video_log[i].user_playlist_name)? " de "+data.video_log[i].user_playlist_name:"")+'<br>'+
																				'</span>'+
																				'<span class="feedTime">'+timeToDifference(Number(data.video_log[i].time)*1000)+'</span>'+
																			'</li>';
					}
				}
			}
		});
	}

	document.getElementsByClassName("app")[0].style.opacity	= 1;
	if(window.localStorage.u_id!="null" && window.localStorage.u_id!=null && window.localStorage.u_id!=undefined){
		$(".current_user_img")[0].setAttribute("src", window.localStorage.user_img);
		$(".current_user_img")[1].setAttribute("src",  window.localStorage.user_img);
		$(".current_user_img")[2].setAttribute("src", window.localStorage.user_img);
		$("#user_name_with_do_da").innerHTML	= (window.localStorage.gender=="male")? "do "+window.localStorage.first_name:"da "+window.localStorage.first_name;
		$(".current_user_name")[0].innerHTML	=  window.localStorage.name;
		$(".current_user_subscribers")[0].innerHTML	= (window.localStorage.subscribers)? window.localStorage.subscribers:0;
		$(".current_user_subscribers")[1].innerHTML	= (window.localStorage.subscribers)? window.localStorage.subscribers:0;
		$(".current_user_follows")[0].innerHTML	= 0;
		document.location.hash	= "#feed";
	}else{
		var app_login		= document.createElement("div");
		app_login.className	= "app_login";
		document.body.insertBefore(app_login, document.body.firstChild);
		
		var app_login_div		= document.createElement("div");
		app_login_div.style		= "position:relative;display:table;transform:translateY(-50%);-webkit-transform:translateY(-50%);top:50%;width:100%";
		app_login.insertBefore(app_login_div, app_login.firstChild);
		var googleLoginBtn		= new Image();
		googleLoginBtn.id		= "google_login";
		googleLoginBtn.onload	= function(){
			googleLoginBtn.style.marginBottom	= "15px";
			app_login_div.insertBefore(googleLoginBtn, app_login_div.firstChild);
		
			/* Init APP with Facebook */
			("touchend".split(" ")).forEach(function(e){
				document.getElementById("google_login").addEventListener(e, function(event){
					event.preventDefault();
					initAPPGoogle();
				}, false);
			});
		}
		googleLoginBtn.src		= "img/google_login_btn.jpg";
		
		var fbLoginBtn		= new Image();
		fbLoginBtn.id		= "facebook_login";
		fbLoginBtn.onload	= function(){
			fbLoginBtn.style.marginTop	= "15px";
			app_login_div.insertBefore(fbLoginBtn, app_login_div.firstChild);
		
			/* Init APP with Facebook */
			("touchend".split(" ")).forEach(function(e){
				document.getElementById("facebook_login").addEventListener(e, function(event){
					event.preventDefault();
					initAPPFacebook();
				}, false);
			});
		}
		fbLoginBtn.src		= "img/facebook_login_btn.png";
	}
	
	function getUserInfo(response){
		document.getElementById("feed_ul").innerHTML	= "<img src='img/loading.svg' style='width:45px;display:table;margin-top:25px;margin-left:auto;margin-right:auto' alt=''>";
		
		/* Facebook login */
		if(response.id){
			window.localStorage.fb_id		= response.id;
			window.localStorage.google_id	= "";
			window.localStorage.name		= response.name;
			window.localStorage.first_name	= response.first_name;
			window.localStorage.last_name	= response.last_name;
			window.localStorage.email		= response.email;
			window.localStorage.gender		= response.gender;
			window.localStorage.user_img	= response.picture.data.url;
			
		/* Google login*/
		}else{
			window.localStorage.fb_id		= "";
			window.localStorage.google_id	= response.userId;
			window.localStorage.name		= response.displayName;
			window.localStorage.first_name	= response.givenName;
			window.localStorage.last_name	= response.familyName;
			window.localStorage.email		= response.email;
			window.localStorage.gender		= "";
			window.localStorage.user_img	= response.imageUrl;
		}
		
		$(".current_user_img")[0].setAttribute("src", window.localStorage.user_img);
		$(".current_user_img")[1].setAttribute("src", window.localStorage.user_img);
		$(".current_user_img")[2].setAttribute("src", window.localStorage.user_img);
		$(".current_user_name")[0].innerHTML	= window.localStorage.name;
		$("#user_name_with_do_da").innerHTML	= (window.localStorage.gender=="male")? "do "+window.localStorage.first_name:"da "+window.localStorage.first_name;
		 
		vanillaAjax({
			url:"http://youoff.me/posts/",
			data:	"fb_id="+window.localStorage.getItem('fb_id')+
					"&google_id="+window.localStorage.getItem('google_id')+
					"&first_name="+window.localStorage.first_name+
					"&last_name="+window.localStorage.last_name+
					"&email="+window.localStorage.email+
					"&gender="+window.localStorage.gender+
					"&user_img="+window.localStorage.user_img,
			dataType:"JSON"
		}, function(data){
			if(data.u_id){
				window.localStorage.u_id		= data.u_id;
				window.localStorage.subscribers	= data.subscribers;
				window.localStorage.follows		= data.follows;
				$(".current_user_subscribers")[0].innerHTML	= window.localStorage.subscribers;
				$(".current_user_subscribers")[1].innerHTML	= window.localStorage.subscribers;
				$(".current_user_follows")[0].innerHTML	= 0;
				window.location.reload(true);
				//document.location.hash	= "#feed";
			}
		});
	}
	
	function initAPPGoogle(){
		//window.plugins.googleplus.trySilentLogin({
		window.plugins.googleplus.login({
			//'scopes':'profile',
			//'scopes':'https://www.googleapis.com/auth/contacts.readonly profile email',
			//'scopes': 'https://www.googleapis.com/auth/plus.login',
			//'webClientId': '801733331523-e1sjq1hfldohho0fcuqrbdjqk9q7pc39.apps.googleusercontent.com',
			'offline': true,
		}, function(response){
			$(".app_login")[0].style.display		= "none";
			$(".app")[0].style.opacity				= 1;
			getUserInfo(response);
		}, function(msg){
			alert('erro: '+msg);
		});
	}
	
	function initAPPFacebook(){
		CordovaFacebook.login({permissions:['email', 'public_profile'], onSuccess:function(response){
			if(response.declined.length>0){
				
			}else{
				$(".app_login")[0].style.display		= "none";
				$(".app")[0].style.opacity				= 1;
				vanillaAjax({
					url:"https://graph.facebook.com/v2.9/me?access_token="+response.accessToken,
					data:"debug=all&fields=id,name,first_name,last_name,email,gender,picture&format=json&method=post&pretty=0&suppress_http_code=1",
					dataType:"JSON"
				}, function(response_){
					getUserInfo(response_);
				});
			}
		}, onFailure:function(error){
				alert(error);
			}
		});
	}
	
	/* On focus on any input */
	("focus".split(" ")).forEach(function(e){
		var inputs	= document.getElementsByTagName("input");
		for(var i=0;i<inputs.length;i++){
			inputs[i].addEventListener(e, function(e){
				addClass($(".all")[0], "all_on_input_focus");
				addClass($(".appFooter")[0], "hide_footer");
				//addClass($(".sharePageButton")[0], "display_none");
				//addClass($(".sharePageButton")[1], "display_none");
			},false);
		}
	});
	
	/* On focus on any input */
	("blur".split(" ")).forEach(function(e){
		var inputs	= document.getElementsByTagName("input");
		for(var i=0;i<inputs.length;i++){
			inputs[i].addEventListener(e, function(e){
				thisHash_	= document.location.hash.split("&");
				if(thisHash_[0]!="#player" && thisHash_[0]!="#player_live" && thisHash_[0]!="#playerShare" && thisHash_[0]!="#playerComment" && thisHash_[0]!="#add_playlist"){
					removeClass($(".all")[0], "all_on_input_focus");
					removeClass($(".appFooter")[0], "hide_footer");
					//removeClass($(".sharePageButton")[0], "display_none");
					//removeClass($(".sharePageButton")[1], "display_none");
				}
			},false);
		}
	});
	
	/* Quit from any player */
	("touchend".split(" ")).forEach(function(e){
		var quit_from_player	= $(".quit_from_player");
		for(var i=0;i<quit_from_player.length;i++){
			quit_from_player[i].addEventListener(e, function(e){
				var thisQuitPlayer	= this;
				addClass(thisQuitPlayer.parentNode.parentNode.parentNode, "opacity_0");
				setTimeout(function(){
					window.history.back();
					window.history.back();
					setTimeout(function(){
						removeClass(thisQuitPlayer.parentNode.parentNode.parentNode, "opacity_0");
					}, 500);
				}, 500);
			},false);
		}
	});
	
	/* Change music time */
	("touchend".split(" ")).forEach(function(e){
		$("#playerProgressOnMouseUp_player").addEventListener(e, function(event){
			var clickX	= ((event.changedTouches[0].pageX*100)/window.innerWidth).toFixed(2);
			$("#playerViewed_player").style.width	= clickX+"%";
			if(player){
				if(player.getCurrentTime){
					player.seekTo(((player.getDuration().toFixed(0)*clickX)/100));
				}
			}
		},false);
	});

	/* Play and pause music on player */
	("touchend".split(" ")).forEach(function(e){
		var pause_play_player	= $(".pause_play_player");
		for(var i=0;i<pause_play_player.length;i++){
			pause_play_player[i].addEventListener(e, function(){
				(player.getPlayerState()==1)? player.pauseVideo():player.playVideo();
			},false);
		}
	});
	
	/* Next music on player */
	("touchend".split(" ")).forEach(function(e){
		var next_player	= $(".next_player");
		for(var i=0;i<next_player.length;i++){
			next_player[i].addEventListener(e, function(){
				if(player.getPlayerState()==1) player.nextVideo();
			},false);
		}
	});
	
	/* Back music on player */
	("touchend".split(" ")).forEach(function(e){
		var back_player	= $(".back_player");
		for(var i=0;i<back_player.length;i++){
			back_player[i].addEventListener(e, function(){
				if(player.getPlayerState()==1) player.previousVideo();
			},false);
		}
	});
	
	/* Share on Twitter */
	("touchend".split(" ")).forEach(function(e){
		$("#share_on_twitter").addEventListener(e, function(e){
			window.plugins.socialsharing.shareViaTwitter($("#share_text").value);
		},false);
	});
	
	/* Share on Twitter */
	("touchend".split(" ")).forEach(function(e){
		$("#share_on_google").addEventListener(e, function(e){
			window.plugins.socialsharing.shareVia(	'com.google.android.apps.plus', 
													$("#share_text").value, 
													null, 
													null, 
													null, 
													function(){
														console.log('share ok')
													}, function(msg){
														alert('error: ' + msg)
													});
		},false);
	});
	
	/* Share on Twitter */
	("touchend".split(" ")).forEach(function(e){
		$("#share_on_whatsapp").addEventListener(e, function(e){
			window.plugins.socialsharing.shareViaWhatsApp($("#share_text").value, 
															null /* img */, 
															null /* url */, function(){
																console.log('share ok')
															}, function(errormsg){
																alert(errormsg)
															});
		},false);
	});
	
	/* Share on Facebook */
	("touchend".split(" ")).forEach(function(e){
		$("#share_on_facebook").addEventListener(e, function(e){
			window.plugins.socialsharing.shareViaFacebook($("#share_text").value, 
															null /* img */, 
															null /* url */, 
															function(){
																console.log('share ok')
															}, function(errormsg){
																alert(errormsg)
															});
		},false);
	});
	
	/* Change live button on player on player */
	("touchend".split(" ")).forEach(function(e){
		$("#player").getElementsByClassName("liveButton")[0].addEventListener(e, function(e){
			var liveButtonSides	= $(".liveButton_on");
			if(player.getPlayerState()==1 && music_title!="" && playlist!=""){
				for(var i=0;i<liveButtonSides.length;i++){
					toggleClass(liveButtonSides[i], "display_table");
				}
				
				if(this.className=="liveButton"){
					vanillaAjax({
						url:"http://youoff.me/posts/",
						data:"add_video_live_u_id="+window.localStorage.u_id+"&add_video_live_video_id="+player.getVideoData()["video_id"]+"&add_video_live_title="+music_title+"&add_video_live_playlist="+playlist+"&add_video_live_img="+music_img
					}, function(data){
						
					});
				}
				toggleClass(this, "liveButtonActive");
			}
		},false);
	});

	/* Change live button on player on player */
	("touchend".split(" ")).forEach(function(e){
		var playerOptions_li	= $(".playerOptions")[0].getElementsByTagName("li");
		for(var i=0;i<playerOptions_li.length;i++){
			playerOptions_li[i].addEventListener(e, function(){
				var playerOptions_active	= $(".playerOptions_active");
				if(playerOptions_active.length>0) playerOptions_active[0].className	= "";
				this.className	= "playerOptions_active";
			},false);
		}
	});
	
	/* Follow user */
	("touchend".split(" ")).forEach(function(e){
		var	followButton	= $(".followButton")[0];
		followButton.addEventListener(e, function(){
			follow_u_id		= this.getAttribute("data-u_id");
			if(followButton.innerHTML=="seguir"){
				vanillaAjax({
					url:"http://youoff.me/posts/",
					data:"follow_u_id="+follow_u_id+"&u_id="+window.localStorage.u_id,
					dataType:"JSON",
					beforeSend:function(){
						addClass(followButton, "no_clicks");
					}
				}, function(data){
					followButton.innerHTML	= "deixar de seguir";
					removeClass(followButton, "no_clicks");
				});
			}else{
				vanillaAjax({
					url:"http://youoff.me/posts/",
					data:"remove_follow_u_id="+follow_u_id+"&u_id="+window.localStorage.u_id,
					dataType:"JSON",
					beforeSend:function(){
						addClass(followButton, "no_clicks");
					}
				}, function(data){
					followButton.innerHTML	= "seguir";
					removeClass(followButton, "no_clicks");
				});
			}
		});
	});
	
	/* Blind icons on footer on click */
	("touchend".split(" ")).forEach(function(e){
		var li	= $(".appFooter")[0].getElementsByTagName("ul")[0].getElementsByTagName("li");
		for(var i=0;i<li.length;i++){
			var a	= li[i].getElementsByTagName("a");
			for(var k=0;k<a.length;k++){
				a[k].addEventListener(e, function(){
					//$(this).fade("out", 300);
				}, false);
			}
		}
	});
	
	/* Add a name to a playlist */
	("touchend".split(" ")).forEach(function(e){
		$("#add_playlist_btn").addEventListener(e, function(event){
			if($("#add_playlist_text").value.length>0){
				video_ids	= "";
				for(var i=0;i<addToFavoritesList.length;i++){
					video_ids	+= addToFavoritesList[i].videoid+", ";
				}
				video_ids	= video_ids.substr(0, video_ids.length-2);
				vanillaAjax({
					url:"http://youoff.me/posts/",
					data:"u_id="+window.localStorage.u_id+
						"&add_playlist_name="+$("#add_playlist_text").value+
						"&add_playlist_videos="+video_ids+
						"&add_playlist_img="+$("#add_favorites_ul").getElementsByTagName("li")[0].getElementsByTagName("img")[0].src,
					dataType:"JSON",
					beforeSend:function(){
						$("#add_playlist_text").value	= "";
						addClass($("#add_playlist_btn"), "no_clicks");
						addClass($("#add_playlist_text"), "no_clicks");
					}
				}, function(data){
					removeClass($("#add_playlist_btn"), "no_clicks");
					removeClass($("#add_playlist_text"), "no_clicks");
					document.location.hash	= "#my_account";
				});
			}
		});
	});
	
	/* On tab on document 
	document.addEventListener("click", function(event){
		alert(123);
	});*/
	
	/* Add to favorite and play music index button */
	("click".split(" ")).forEach(function(e){
		document.addEventListener(e, function(event){
			
			if(event.target.classList.contains("addFavorite") || event.target.parentNode.classList.contains("addFavorite")){
				thisMusic	= (event.target.classList.contains("addFavorite"))? event.target:event.target.parentNode,
				thisVideoId	= thisMusic.getAttribute("data-videoid");
				if(thisMusic.classList.contains("added")){
					for(var i=0;i<addToFavoritesList.length;i++){
						if(thisVideoId==addToFavoritesList[i].videoid) addToFavoritesList.splice(i, 1);
					}
				}else{
					addToFavoritesList.push({
						"videoid":thisVideoId,
						"videoimg":thisMusic.getAttribute("data-videoimg"),
						"videoname":thisMusic.getAttribute("data-videoname")
					});
				}
				toggleClass(thisMusic, "added");
			}
			
			if(event.target.classList.contains("live_u_name")){
				clicked_item			= event.target;
				live_u_name				= clicked_item.getAttribute("data-u_name");
			}
			
			if(event.target.classList.contains("playlistItem")){
				feed_Item				= event.target;
				music_title				= feed_Item.getAttribute("data-title");
				playlist				= feed_Item.getAttribute("data-playlist");
				music_img				= feed_Item.getAttribute("data-thumb");
				document.location.hash	= "#player";
			}
			
			if(event.target.classList.contains("musicItemLive") || event.target.parentNode.classList.contains("musicItemLive") || event.target.parentNode.parentNode.classList.contains("musicItemLive")){
				var musicItemLive		= (event.target.classList.contains("musicItemLive"))? event.target:event.target.parentNode;
				musicItemLive			= (event.target.parentNode.parentNode.classList.contains("musicItemLive"))? event.target.parentNode.parentNode:musicItemLive;
				live_u_img				= musicItemLive.getAttribute("data-u_id_img");
				live_u_name				= musicItemLive.getAttribute("data-u_name");
				music_title				= musicItemLive.getAttribute("data-title");
				music_duration			= musicItemLive.getAttribute("data-duration");
				music_id				= musicItemLive.getAttribute("data-videoid");
				music_img				= musicItemLive.getAttribute("data-thumb");
				playlist				= musicItemLive.getAttribute("data-playlist");
				ul_id					= musicItemLive.getAttribute("data-ul_id");				
				$("#liveButtonTransmissao").style.opacity	= 0;
				document.location.hash	= "#player_live";
			}
			
			if(event.target.classList.contains("playlistIndex") || event.target.parentNode.classList.contains("playlistIndex")){
				var playlistIndex	= event.target.getAttribute("data-index");
				player.loadPlaylist({playlist:currentPlaylist, index:playlistIndex, suggestedQuality:'small'});
			}	
		});
	});
	
	var like_in_player	= $("#like_in_player");
	/* Click on like button on live */
	("touchend".split(" ")).forEach(function(e){
		like_in_player.addEventListener(e, function(event){
			if(player){
				if(playlist!=""){
					if(like_in_player.className!="playerStatistics_active"){
						vanillaAjax({
							url:"http://youoff.me/posts/",
							data:	"add_playlist_to_likes_id="+playlist+
									"&u_id="+window.localStorage.u_id,
							dataType:"JSON",
							beforeSend:function(){
								addClass(like_in_player, "no_clicks");
							}
						}, function(data){
							like_in_player.setAttribute("data-pl_id", data);
							removeClass(like_in_player, "no_clicks");
							$("#playerStatistics_likes").innerHTML	= Number($("#playerStatistics_likes").innerHTML)+1;
						});
					}else{
						vanillaAjax({
							url:"http://youoff.me/posts/",
							data:	"remove_playlist_to_likes_id="+playlist+
									"&pl_id="+like_in_player.getAttribute("data-pl_id")+
									"&u_id="+window.localStorage.u_id,
							dataType:"JSON",
							beforeSend:function(){
								addClass(like_in_player, "no_clicks");
							}
						}, function(data){
							removeClass(like_in_player, "no_clicks");
							$("#playerStatistics_likes").innerHTML	= Number($("#playerStatistics_likes").innerHTML)-1;
						});
					}
					toggleClass(like_in_player, "playerStatistics_active");
				}else{
					return false;
				}
			}
		});
	});
	
	var comment_in_player	= $("#comment_in_player");
	/* Click on like button on live */
	("touchend".split(" ")).forEach(function(e){
		comment_in_player.addEventListener(e, function(event){
			if(player){
				if(playlist!=""){
					$(".commentsList")[0].innerHTML	= "<img src='img/loading.svg' style='width:45px;display:table;margin-top:25px;margin-left:auto;margin-right:auto' alt=''>";
					vanillaAjax({
						url:"http://youoff.me/posts/",
						data:"comment_playlist_id="+playlist,
						dataType:"JSON",
						beforeSend:function(){
							addClass(like_in_player, "no_clicks");
						}
					}, function(data){
						removeClass(like_in_player, "no_clicks");
						$(".commentsList")[0].innerHTML	= "";
						for(var i=0;i<data.length;i++){
							$(".commentsList")[0].innerHTML		+= '<li>'+
																		'<a href="#user_page&u_id='+data[i].u_id+'">'+
																			'<img class="userImage" src="'+data[i].u_img+'" alt="">'+
																		'</a>'+
																		'<span class="userName"><a href="#user_page&u_id='+data[i].u_id+'">'+data[i].name+'</a></span>'+
																		'<div>'+
																			data[i].c_text+
																		'</div>'+
																		'<div style="clear:both"></div>'+
																	'</li>';
						}
					});
					toggleClass(like_in_player, "playerStatistics_active");
				}else{
					return false;
				}
			}
		});
	});
	
	var send_message_to_live		= $("#send_message_to_live");
	var send_message_to_live_text	= $("#send_message_to_live_text");
	/* Send comment */
	("touchend".split(" ")).forEach(function(e){
		send_message_to_live.addEventListener(e, function(event){
			if(player){
				if(playlist!=""){
					$("#live_comments_ul").innerHTML		= '<li>'+
																	'<img class="userImage" src="'+window.localStorage.user_img+'" alt="">'+
																	'<span>'+
																		'<b>'+window.localStorage.name+'</b><br>'+
																		send_message_to_live_text.value+
																	'</span>'+
																'</li>'+$("#live_comments_ul").innerHTML;
															
					vanillaAjax({
						url:"http://youoff.me/posts/",
						data:"send_comment_playlist_live_id="+playlist+
							"&send_comment_text="+send_message_to_live_text.value+
							"&ul_id="+ul_id+
							"&u_id="+window.localStorage.u_id,
						dataType:"JSON",
						beforeSend:function(){
							addClass(send_message_to_live, "no_clicks");
							send_message_to_live_text.value	= "";
						}
					}, function(data){
						removeClass(send_message_to_live, "no_clicks");
					});
				}else{
					return false;
				}
			}
		});
	});
	
	var send_comment		= $("#send_comment");
	var send_comment_text	= $("#send_comment_text");
	/* Send comment */
	("touchend".split(" ")).forEach(function(e){
		send_comment.addEventListener(e, function(event){
			if(player){
				if(playlist!=""){
					$(".commentsList")[0].innerHTML		+= '<li>'+
																'<a href="#user_page&u_id='+window.localStorage.u_id+'">'+
																	'<img class="userImage" src="'+window.localStorage.user_img+'" alt="">'+
																'</a>'+
																'<span class="userName"><a href="#user_page&u_id='+window.localStorage.u_id+'">'+window.localStorage.name+'</a></span>'+
																'<div>'+
																	send_comment_text.value+
																'</div>'+
																'<div style="clear:both"></div>'+
															'</li>';
					vanillaAjax({
						url:"http://youoff.me/posts/",
						data:"send_comment_playlist_id="+playlist+
							"&send_comment_text="+send_comment_text.value+
							"&u_id="+window.localStorage.u_id,
						dataType:"JSON",
						beforeSend:function(){
							addClass(send_comment, "no_clicks");
						}
					}, function(data){
						removeClass(send_comment, "no_clicks");
					});
				}else{
					return false;
				}
			}
		});
	});
	
	var favorite_in_player	= $("#favorite_in_player");
	/* Click on favorite button on live */
	("touchend".split(" ")).forEach(function(e){
		favorite_in_player.addEventListener(e, function(event){
			if(player){
				if(playlist!=""){
					if(favorite_in_player.className!="playerStatistics_active"){
						vanillaAjax({
							url:"http://youoff.me/posts/",
							data:	"add_playlist_to_favorites_id="+playlist+
									"&u_id="+window.localStorage.u_id,
							dataType:"JSON",
							beforeSend:function(){
								addClass(favorite_in_player, "no_clicks");
							}
						}, function(data){
							favorite_in_player.setAttribute("data-pf_id", data);
							removeClass(favorite_in_player, "no_clicks");
							$("#playerStatistics_favorites").innerHTML	= Number($("#playerStatistics_favorites").innerHTML)+1;
						});
					}else{
						vanillaAjax({
							url:"http://youoff.me/posts/",
							data:	"remove_playlist_to_favorites_id="+playlist+
									"&pf_id="+favorite_in_player.getAttribute("data-pf_id")+
									"&u_id="+window.localStorage.u_id,
							dataType:"JSON",
							beforeSend:function(){
								addClass(favorite_in_player, "no_clicks");
							}
						}, function(data){
							removeClass(favorite_in_player, "no_clicks");
							$("#playerStatistics_favorites").innerHTML	= Number($("#playerStatistics_favorites").innerHTML)-1;
						});
					}
					toggleClass(favorite_in_player, "playerStatistics_active");
				}else{
					return false;
				}
			}
		});
	});
	
	var add_in_player	= $("#add_in_player");
	/* Click on add playlist button on player */
	("touchend".split(" ")).forEach(function(e){
		add_in_player.addEventListener(e, function(event){
			if(player){
				if(playlist!=""){
					if(add_in_player.className!="playerStatistics_active"){
						vanillaAjax({
							url:"http://youoff.me/posts/",
							data:	"add_playlist_to_added="+playlist+
									"&u_id="+window.localStorage.u_id,
							dataType:"JSON",
							beforeSend:function(){
								addClass(add_in_player, "no_clicks");
							}
						}, function(data){
							add_in_player.setAttribute("data-pa_id", data);
							removeClass(add_in_player, "no_clicks");
							$("#playerStatistics_added").innerHTML	= Number($("#playerStatistics_added").innerHTML)+1;
						});
					}else{
						vanillaAjax({
							url:"http://youoff.me/posts/",
							data:	"remove_playlist_to_added="+playlist+
									"&pa_id="+add_in_player.getAttribute("data-pa_id")+
									"&u_id="+window.localStorage.u_id,
							dataType:"JSON",
							beforeSend:function(){
								addClass(add_in_player, "no_clicks");
							}
						}, function(data){
							removeClass(add_in_player, "no_clicks");
							$("#playerStatistics_added").innerHTML	= Number($("#playerStatistics_added").innerHTML)-1;
						});
					}
					toggleClass(add_in_player, "playerStatistics_active");
				}else{
					return false;
				}
			}
		});
	});
	
	/* Click on like button on live */
	("touchend".split(" ")).forEach(function(e){
		var like_icon	= $(".player_comment")[0].getElementsByTagName("IMG")[0];
		like_icon.addEventListener(e, function(event){
			if(like_icon.className=="love_off"){
				like_icon.className	= "icon_on";
				like_icon.src		= "img/love_on.svg";
				
				vanillaAjax({
					url:"http://youoff.me/posts/",
					data:	"add_playlist_live_to_favorites_id="+playlist+
							"&u_id="+window.localStorage.u_id,
					dataType:"JSON",
					beforeSend:function(){
						addClass(like_icon, "no_clicks");
					}
				}, function(data){
					removeClass(like_icon, "no_clicks");
				});
				
				var white_or_red		= ['love_on', 'love_red'],
				heart_img			= new Image();
			
				heart_img.onload		= function(){
					var thisImg			= this;
					thisImg.style.right	= (Math.floor(Math.random()*30)+20)+'px';
					document.body.insertBefore(thisImg, document.body.firstChild);
					setTimeout(function(){
						thisImg.style.bottom	= "40px";
						thisImg.style.opacity	= 0.75;
				
						setTimeout(function(){
							thisImg.style.bottom	= "60px";
							thisImg.style.opacity	= 0.5;
							thisImg.style.right	= (Math.floor(Math.random()*30)+20)+'px';
					
							setTimeout(function(){
								thisImg.style.bottom	= "80px";
								thisImg.style.opacity	= 0.35;
								thisImg.style.right	= (Math.floor(Math.random()*30)+20)+'px';
						
								setTimeout(function(){
									thisImg.style.bottom	= "100px";
									thisImg.style.opacity	= 0;
									thisImg.style.right	= (Math.floor(Math.random()*30)+20)+'px';
							
									setTimeout(function(){
										thisImg.remove();
									}, 300);
								}, 300);
							}, 300);
						}, 300);
					}, 10);
				}
				heart_img.className	= "love_animation";
				heart_img.src	= "img/"+white_or_red[Math.floor(Math.random()*white_or_red.length)]+".svg";
			}else{
				like_icon.className	= "love_off";
				like_icon.src		= "img/love.svg";
				
				vanillaAjax({
					url:"http://youoff.me/posts/",
					data:	"remove_playlist_live_to_favorites_id="+playlist+
							"&u_id="+window.localStorage.u_id,
					dataType:"JSON",
					beforeSend:function(){
						addClass(save_live_playlist_to_favorites, "no_clicks");
					}
				}, function(data){
					removeClass(save_live_playlist_to_favorites, "no_clicks");
				});
			}
		}, false);
	});

	/* Search input */
	var searchInput = $("#search_input");
	searchInput.addEventListener("keyup", function(){
		var string	= this.value,
			type	= document.location.hash.replace("#","").split("&")[1] || "mixed";
		//if(string.length>0){
			$("#"+type).innerHTML	= "";
			results	= (type=="mixed")? 2:3;
			getYTVideos({type:type, results:results});
		//}
	}, false);

	/* Get videos */
	function getYTVideos(options){
		vanillaAjax({
			url:"http://youoff.me/posts/",
			data:"type="+options.type+"&q="+searchInput.value+"&results="+options.results,
			dataType:"JSON",
			beforeSend:function(){
				$("#"+options.type).innerHTML	= "<img src='img/loading.svg' style='width:45px;display:table;margin-top:25px;margin-left:auto;margin-right:auto' alt=''>";
			}
		}, function(data){
			$("#"+options.type).innerHTML	= "";
			var type_from_yt	= options.type=="music"? "video":"channel";
				type_from_yt	= options.type=="playlist"? "playlist":type_from_yt;
				type_from_yt	= options.type=="mixed"? "mixed":type_from_yt;
			if(type_from_yt!="mixed"){
				if(type_from_yt=="video"){
					for(var i=0;i<data["playlist"].length;i++){
						for(var k=0;k<data["playlist"][i]["videos"].length;k++){
							addYTSearch(type, data["playlist"][i]["videos"][k], false);
						}
					}
				}else{
					for(var i=0;i<data[type_from_yt].length;i++){
						addYTSearch(type, data[type_from_yt][i], false);
					}
				}
			}else{
				if(data["video"] && data["channel"] && data["playlist"]){
					/* 1 Music */
					if(data["playlist"][0]) if(data["playlist"][0]["videos"][1]) addYTSearch("music", data["playlist"][0]["videos"][1], true);

					/* 2 Users */
					if(data["channel"][0]) addYTSearch("user", data["channel"][0], true);
					if(data["channel"][1]) addYTSearch("user", data["channel"][1], true);

					/* 1 Playlist */
					if(data["playlist"][0]) addYTSearch("playlist", data["playlist"][0], true);

					/* 2 Musics */
					if(data["playlist"][1]) if(data["playlist"][1]["videos"][1]) addYTSearch("music", data["playlist"][1]["videos"][1], true);
					if(data["playlist"][1]) if(data["playlist"][1]["videos"][2]) addYTSearch("music", data["playlist"][1]["videos"][2], true);
					
					/* 1 Playlist */
					if(data["playlist"][1]) addYTSearch("playlist", data["playlist"][1], true);
					
					/* 2 Musics */
					if(data["playlist"][2]) if(data["playlist"][2]["videos"][1]) addYTSearch("music", data["playlist"][2]["videos"][1], true);
					if(data["playlist"][2]) if(data["playlist"][2]["videos"][2]) addYTSearch("music", data["playlist"][2]["videos"][2], true);
				}
			}
		})
	}

	/* Add videos */
	function addYTSearch(type, data, mixed){
		id				= (!mixed)? type:"mixed";
		if(type=="user"){
			$("#"+id).innerHTML	+= '<div class="searchFeedItem userItem" data-uid="'+data.u_id+'" data-subscribers="'+data.subscribers+'" data-thumb="'+data.thumb+'" data-name="'+data.title+'">'+
										'<img class="itemBackground" src="'+data.thumb+'" alt="">'+
										'<img class="userImage" src="'+data.thumb+'" alt="">'+
										'<div>'+
											data.title+
											'<em>'+data.subscribers+' seguidores</em>'+
										'</div>'+
									'</div>';
		}
		if(type=="music"){
			$("#"+id).innerHTML	+= '<div class="searchFeedItem musicItem" data-playlist="'+data.playlist+'" data-title="'+data.title+'" data-duration="'+data.duration+'" data-videoid="'+data.videoId+'" data-thumb="'+data.thumb+'">'+
										'<img class="itemBackground" src="'+data.thumb+'" alt="">'+
										'<div>'+
											data.title+
											'<em>'+data.watchers+' pessoas ouviram</em>'+
										'</div>'+
									'</div>';
		}
		if(type=="playlist"){
			$("#"+id).innerHTML	+= '<div class="searchFeedItem playlistItem" data-title="'+data.title+'" data-playlist="'+data.playlist+'" data-thumb="'+data.thumb+'">'+
										'<img class="itemBackground" src="'+data.thumb+'" alt="">'+
										'<div>'+
											data.title+
											'<em>'+data["statistics"][0].added+' adicionaram essa playlist</em>'+
										'</div>'+
									'</div>';
		}
	}

	function onHashChange(){
		if(document.location.hash){
			var thisHash	= document.location.hash.replace("#","").split("&");
			activeClass		= document.querySelectorAll(".app_swiper .active, .appFooter .active");
			for(var i=0;i<activeClass.length;i++){ activeClass[i].className = removeClass(activeClass[i], "active"); }
			
			if(document.location.hash.length<30){
				aLinks			= document.querySelectorAll("a[href='#"+thisHash[0]+"'], a[href='"+document.location.hash+"']");
				for(var i=0;i<aLinks.length;i++){
					var parent	= aLinks[i].parentNode;
					if(parent.tagName=="LI") parent.className = "active";
				}
			}
			principalSlides	= document.querySelectorAll(".app_swiper>.swiper-wrapper>.swiper-slide");
			for(var i=0;i<principalSlides.length;i++){
				addClass(principalSlides[i], "display_none");
			}
			principalSlideActive	= $("#"+thisHash[0]);
			if(principalSlideActive) removeClass(principalSlideActive, "display_none");
		
			/* Swipe do Hashtag */
			principalHash	= document.querySelectorAll(".app_swiper .swiper-slide[data-hash='"+thisHash[0]+"']"),
			searchHash		= document.querySelectorAll(".search_swiper .swiper-slide[data-hash='"+thisHash[0]+"']"),
			userHash		= document.querySelectorAll(".user_swiper .swiper-slide[data-hash='"+thisHash[0]+"']"),
			accountHash		= document.querySelectorAll(".account_swiper .swiper-slide[data-hash='"+thisHash[0]+"']");
			//if(principalHash.length>0) app_swiper.slideTo(index(principalHash[0]));
			if(searchHash.length>0) search_swiper.slideTo(index(searchHash[0]));
			if(userHash.length>0) user_swiper.slideTo(index(userHash[0]));
			if(accountHash.length>0) account_swiper.slideTo(index(accountHash[0]));
		
			if(thisHash[0]=="feed"){
				loadFeed();
			}
			
			if(thisHash[0]=="notify"){
				loadNotifications();
			}
		
			if(thisHash[0]=="playerComment"){
				setTimeout(function(){
					addClass($("#playerComment"), "top_0");
				}, 50);
			}else{
				removeClass($("#playerComment"), "top_0");
			}
			
			if(thisHash[0]=="playerShare"){
				setTimeout(function(){
					addClass($("#playerShare"), "top_0");
				}, 50);
			}else{
				removeClass($("#playerShare"), "top_0");
			}
			
			if(thisHash[0]=="add_playlist"){
				if(addToFavoritesList.length==0){
					window.history.back();
				}
				$("#add_favorites_ul").innerHTML	= "";
				for(var i=0;i<addToFavoritesList.length;i++){
					$("#add_favorites_ul").innerHTML	+=	'<li>'+
																'<img src="'+addToFavoritesList[i].videoimg+'" alt="">'+
																'<span>'+addToFavoritesList[i].videoname+'</span>'+
															'</li>';
				}
			}
		
			if(thisHash[0]=="search"){
				if(thisHash[1]==undefined){
					var searchTabs = $(".searchTabs");
					for(var i=0;i<searchTabs.length;i++){
						searchTabs[i].getElementsByTagName("li")[0].className	= "active";
					}
				}
				type	= document.location.hash.replace("#","").split("&")[1] || "mixed";
				if($("#"+type).innerHTML=="" || $("#"+type).innerHTML=="<img src='img/loading.svg' style='width:45px;display:table;margin-top:25px;margin-left:auto;margin-right:auto' alt=''>") getYTVideos({type:type, results:10});
			}
		
			if(thisHash[0]=="my_account" && !thisHash[1]){
				addToFavoritesList	= [];
				if(thisHash[1]==undefined){
					$(".my_account_slide")[0].getElementsByClassName("userTabs")[0].getElementsByTagName("li")[0].className = "active";
				}
				loadAccountFeed("my_account", "my_account", window.localStorage.u_id);
			}
		
			if(thisHash[0]=="user_page"){
				if(thisHash[1]==undefined){
					$(".user_page_slide")[0].getElementsByClassName("userTabs")[0].getElementsByTagName("li")[0].className = "active";
				}else{
					if(thisHash[1].split("=").length>1){
						if(thisHash[1].split("=")[1]!=window.localStorage.u_id){
							$(".user_page_slide")[0].getElementsByClassName("userTabs")[0].getElementsByTagName("li")[0].className = "active";
							loadAccountFeed("user_page", "user_page", thisHash[1].split("=")[1]);
						}else{
							document.location.hash	= "#my_account";
						}
					}
				}
			}
			
			if(thisHash[0]=="player"){
				if(playlist==null || playlist==""){
					document.location.hash	= "#search&mixed";
				}else{
					if(player){
						$("#like_in_player").className			= "";
						like_in_player.setAttribute("data-pl_id", 0);
						
						favorite_in_player.className			= "";
						favorite_in_player.setAttribute("data-pf_id", 0);
						
						add_in_player.className					= "";
						add_in_player.setAttribute("data-pa_id", 0);
						
						$("#playerStatistics_likes").innerHTML		= 0;
						$("#playerStatistics_comments").innerHTML	= 0;
						$("#playerStatistics_favorites").innerHTML	= 0;
						$("#playerStatistics_shares").innerHTML		= 0;
						$("#playerStatistics_added").innerHTML		= 0;
						ul_id	= "";
						player.cueVideoById("u1zgFlCw8Aw", 10, "small");
						player.cuePlaylist({'list':playlist});
						
						$("#playlist_name").innerHTML	= music_title;
						$("#playlist_user_name_text").innerHTML		= (live_u_name==undefined)? "":"Playlist de "+live_u_name;
						
						$(".change_thumb_player")[0].setAttribute("src", music_img);
						$(".change_thumb_player")[1].setAttribute("src", music_img);
						$(".playerMusicList")[0].innerHTML	= "<img src='img/loading.svg' style='width:45px;display:table;margin-top:25px;margin-left:auto;margin-right:auto' alt=''>";
					}
				}
			}
			
			if(thisHash[0]=="player_live"){
				if(playlist==null || playlist==""){
					document.location.hash	= "#feed";
				}else{
					live_player_active	= true;
					$("#live_userImage").setAttribute("src", live_u_img);
					$("#live_userName").innerHTML	= live_u_name.split(" ")[0];
					$("#player_live_music_name").innerHTML	= (music_title)? music_title:"";
					$("#activeSongLive").setAttribute("src", music_img);
					$("#live_comments_ul").innerHTML	= "<img src='img/loading.svg' style='width:45px;display:table;margin-top:25px;margin-left:auto;margin-right:auto' alt=''>";
					player.cueVideoById("u1zgFlCw8Aw", 10, "small");
					player.cuePlaylist({'list':playlist, 'listType':'playlist'});
				}
			}else{
				//if(live_player_active) player.stopVideo();
			}
		
			if(thisHash[0]=="player" || thisHash[0]=="player_live" || thisHash[0]=="playerShare" || thisHash[0]=="playerComment" || thisHash[0]=="add_playlist"){
				$(".all")[0].className	= "all player_slide_active_all";
				removeClass($(".app_swiper")[0], "barra_de_rolagem");
				$(".appFooter")[0].className	= "appFooter hide_footer";
				$(".appHeader")[0].className	= "appHeader hide_header";
				setTimeout(function(){
					addClass($(".liveButtonInfo")[0], "opacity_0");
				}, 12000);
			}else{
				addClass($(".app_swiper")[0], "barra_de_rolagem");
				$(".all")[0].className	= "all barra_de_rolagem";
				$(".appFooter")[0].className	= "appFooter";
				$(".appHeader")[0].className	= "appHeader";
			}
		
			var hashInside	= $("#"+thisHash[1]);
			if(hashInside.length>0) hashInside.style.display	= "block";
			//if(app_swiper && principalHash.length>0) app_swiper.slideTo(index(principalHash[0]));
		}
	}

	/* On hash change */
	window.addEventListener("hashchange", function(){
		setTimeout(onHashChange, 10);
	}, false);
	onHashChange();
}

//document.addEventListener('deviceready', startAPP, false);
window.onload	= startAPP;
