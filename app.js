'use strict';

const { demo, publishedArchive, themes, projects, events, artists } = window.archive;
const content = document.querySelector('#archive-content');
const scrollPanel = document.querySelector('#archive-scroll');
const search = document.querySelector('#search');
if (demo) {
  document.querySelector('.archive-title .soft').textContent = 'DEMO RECORDS';
  document.querySelector('.archive-footer span:last-child').textContent = Object.keys(events).length + ' SAMPLE RECORDS';
}
const status = document.querySelector('#art-status');
const tabs = [...document.querySelectorAll('[data-tab]')];
const artBody = document.querySelector('#art-body');
const world = new ArchitectureWorld(artBody);
const state = { tab: 'themes', theme: null, project: null, artist: null, event: null, clip: 0, scroll: 0 };
const dateShort = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const dateLong = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
const motion = matchMedia('(prefers-reduced-motion: reduce)');
let frame = 0;

const roles = {
  event_description: 'Event description',
  public_description: 'Published description',
  associated_record: 'Event record',
  research_record: 'Research record',
  programme_reference: 'Programme description',
  schedule_reference: 'Schedule reference',
  associated_preparation_or_plan: 'Preparation or plan',
  preparation: 'Preparation',
  associated_correspondence: 'Correspondence',
  inferred_association: 'Working association',
  background_context: 'Background context'
};

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
}

function focusStrips(ids, label) {
  status.textContent = label;
  world.focus(ids);
}
function showNodes(ids, label, keepView = false) {
  const groups = Object.keys(projects).filter(pid => ids.some(id => projects[pid].nodes[id]));
  status.textContent = label + (groups.length ? ' · Project location' : ' · No mapped building');
  if (!keepView) world.focus(groups);
}

function disclosure(type, id, index, title, count, expanded) {
  return `<button type="button" class="tree-row" data-${type}="${id}" aria-expanded="${expanded}"><span class="index-number">${index}</span><strong>${esc(title)}</strong><small>${count}</small><span class="chevron" aria-hidden="true"></span></button>`;
}

function eventList(ids) {
  return '<ul class="event-list">' + ids.map(id => {
    const e = events[id];
    return `<li><button type="button" class="event-row" data-event="${id}"><strong>${esc(e.title)}${e.videos.length ? '<span class="has-video" aria-label="Video available">▶</span>' : ''}</strong><small>${dateShort.format(new Date(e.date))}</small><span class="chevron" aria-hidden="true"></span></button></li>`;
  }).join('') + '</ul>';
}

function themeIndex() {
  return '<ul class="tree">' + themes.map((theme, i) => {
    const children = Object.entries(projects).filter(([, project]) => project.theme === theme.id);
    const expanded = state.theme === theme.id;
    const branch = expanded ? '<ul class="branch">' + children.map(([id, project]) => {
      const open = state.project === id;
      const ids = Object.keys(project.nodes);
      return '<li>' + disclosure('project', id, id, project.title, ids.length, open) +
        (open ? eventList(ids) : '') + '</li>';
    }).join('') + '</ul>' : '';
    return '<li>' + disclosure('theme', theme.id, String(i + 1).padStart(2, '0'), theme.title, children.length, expanded) + branch + '</li>';
  }).join('') + '</ul>';
}


function jennyRoute() {
  const relations=[
    ['P02','Souvenirs & invented artifacts','How branding, storytelling and the presentation of objects shape what feels authentic.','A155'],
    ['P05','Homecoming archaeology','Discussion of invented artifacts for Homecoming and how their stories would be presented to visitors.','A155'],
    ['P14','Campus architecture','Desk critiques on material, form, architectural concepts and the stories buildings communicate.','N001']
  ];
  return '<section class="relation-guide"><h3>One visitor, three projects</h3><p>The bridges in this drawing connect projects associated with Jenny’s discussions and critiques. They show a relationship, not a chronological route.</p>'+
    relations.map(([pid,title,text,eid])=>'<div class="relation-card"><button type="button" data-relation="'+pid+'"><small>'+pid+'</small><strong>'+title+'</strong></button><p>'+text+'</p><button type="button" class="source-record" data-event="'+eid+'">Read '+(eid==='A155'?'22':'24')+' September notes →</button></div>').join('')+
    '<p class="muted">Based on meeting and critique notes; this does not imply participation in every later event.</p></section>';
}

const visitorProjects = { V01:['P06'], V02:['P10'], V03:['P02','P05','P14'], V04:['P02'], V05:['P12'], V06:['P13'], V07:['P09'] };
const visitorContext = {
V01:'Travel-film programme and essay-film workshop.',
V02:'FLOOD story development and writers-room discussions.',
V04:'Alps Sketch is represented within P02. This association does not imply participation in souvenir production.',
V05:'Watermark and handmade-paper collaboration.',
V06:'Named in the programme for the laser-rock performance; a programme listing alone does not confirm attendance.',
V07:'Named musical collaborator in programme records; scheduling alone does not establish completion.'
};
function artistConnections(artist){
if(artist.id==='V03')return jennyRoute();
const ids=visitorProjects[artist.id]||[];
if(!ids.length)return '<p class="artist-note">No project association has been verified for this guest. Available records are listed below.</p>';
return '<section class="relation-guide"><h3>Project connections</h3><p>'+esc(visitorContext[artist.id])+'</p>'+
ids.map(pid=>'<div class="relation-card"><button type="button" data-relation="'+pid+'"><small>'+pid+'</small><strong>'+esc(projects[pid].title)+'</strong></button></div>').join('')+
'<p class="muted">Explore the programme and event records below.</p></section>';
}
function enterArtists(){
state.tab='artists';state.artist=null;state.event=null;state.project=null;state.theme=null;search.value='';
tabs.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab==='artists')));
if(archivePanel.hidden)archiveToggle.click();
render();scrollPanel.scrollTop=0;restoreSelection();
}

function artistRow(artist, i) {
  const expanded = state.artist === artist.id;
  let details = '';
  if (expanded) {
    const { programme, mentions, future } = artist;
    details = '<div class="branch">';
    details += artistConnections(artist);
    if (programme.length) {
      details += '<h3 class="section-label">Documented roles</h3>' + eventList(programme);
    } else {
      details += '<p class="artist-note">No programme activity within this archive’s date range.</p>';
    }
    if (mentions.length) {
      details += '<h3 class="section-label">Named in event records</h3><p class="artist-note">These records may include preparation or invitations.</p>' + eventList(mentions);
    }
    if (future) details += '<p class="artist-note">The November programme falls outside this preview’s date range.</p>';
    details += '</div>';
  }
  return '<li>' + disclosure('artist', artist.id, String(i + 1).padStart(2, '0'), artist.name,
    artist.programme.length + artist.mentions.length, expanded) + details + '</li>';
}

function artistIndex() {
  const roster = artists.filter(a => !a.guest);
  const guests = artists.filter(a => a.guest);
  return '<ul class="tree">' + roster.map(artistRow).join('') + '</ul>' +
    (guests.length ? '<h3 class="section-label">Additional named guests</h3><ul class="tree">' +
      guests.map(artistRow).join('') + '</ul>' : '');
}

const localClips = {
  'A227/0': 'A227-01.mp4',
  'A129/0': 'A129-01.mp4',
  'A129/1': 'A129-02.mp4',
  'A136/0': 'A136-01.mp4'
};

function clipMarkup(event, eid) {
  const selected = event.videos[state.clip];
  const still = state.clip === 0 && event.still ? `<img src="${esc(window.embeddedMedia?.[event.still] ?? event.still)}" alt="Reference frame from this event">` : '';
  return `<div class="video-player">${still}<button class="play-cover" type="button" data-play aria-label="Play clip ${state.clip + 1}"><span aria-hidden="true">▶</span></button></div>
    <div class="video-meta"><span>Clip ${String(state.clip + 1).padStart(2, '0')} / ${event.videos.length} · ${esc(selected.name)}</span>
    <a href="${esc(selected.url)}" target="_blank" rel="noopener noreferrer">Open video ↗</a></div>
    <div class="clip-list" aria-label="Event clips">${event.videos.map((clip, i) => `<button type="button" data-clip="${i}" aria-label="Select clip ${i + 1}" aria-pressed="${i === state.clip}">${String(i + 1).padStart(2, '0')}</button>`).join('')}</div>
    <p class="muted">${publishedArchive ? 'Matched to this event by recording time. Drive playback may require access.' : 'From the working video index.'}</p>`;
}

function playClip() {
  const e = events[state.event];
  const video = e.videos[state.clip];
  const player = document.querySelector('.video-player');
  const local = publishedArchive ? null : localClips[state.event + '/' + state.clip];
  if (video.src) {
    player.innerHTML = `<video controls playsinline autoplay src="${esc(video.src)}" aria-label="Event video"></video>`;
    player.firstElementChild.focus();
    return;
  }
  if (local) {
    player.innerHTML = `<video controls playsinline autoplay src="${window.embeddedMedia?.[local] ?? `media/${local}`}" aria-label="Event video preview"></video>`;
    player.firstElementChild.focus();
    return;
  }
  player.innerHTML = `<iframe src="https://drive.google.com/file/d/${esc(video.id)}/preview" title="Video clip ${state.clip + 1} on Google Drive" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
  player.firstElementChild.focus();
}

function detail(id) {
  const e = events[id];
  const projectsLine = e.projects.map(pid => esc(projects[pid].title)).join(' · ');
  const moment = e.start?.includes('T') ? ' · ' + time.format(new Date(e.start)) + ' ET' : '';
  const names = e.people.length ? '<ul class="people">' + e.people.map(name => `<li>${esc(name)}</li>`).join('') + '</ul>' : '';
  const credits = e.creditedPeople?.length
    ? '<p class="detail-meta">Public credits · ' + e.creditedPeople.map(esc).join(', ') + '</p>'
    : '';
  const programme = e.programmePeople?.length
    ? '<p class="detail-meta">Programme credits · ' + e.programmePeople.map(esc).join(', ') + '</p>'
    : '';
  const calendarNote = names ? 'Calendar invitees. Attendance is unverified.'
    : e.unnamed ? 'The calendar contains invitation entries without display names.'
    : e.hasCalendar ? 'No invitee list was recorded for this occurrence.' : 'No calendar invitee record is available.';
  const notes = e.notes.length ? e.notes.map((note, i) =>
    `<details class="note" ${i === 0 ? 'open' : ''}><summary>${roles[note.role] ?? 'Linked note'}</summary><p>${esc(note.text)}</p>
    ${note.url ? `<a href="${esc(note.url)}" target="_blank" rel="noopener noreferrer">View source ↗</a>` : ''}</details>`).join('')
    : '<p class="muted">No description or notes are linked to this record.</p>';
  return `<article class="detail">
    <button type="button" class="back" data-back>← Back to ${search.value.trim() ? 'results' : state.tab === 'artists' ? 'artists' : 'themes'}</button>
    <header class="detail-header"><span class="event-id">EVENT / ${id}</span><h3 tabindex="-1">${esc(e.title)}</h3>
    <p class="detail-meta">${dateLong.format(new Date(e.date))}${moment}${e.location ? ' · ' + esc(e.location) : ''}</p><p class="detail-meta">${projectsLine}</p></header>
    <section><h4>People</h4>${credits}${programme}${names}<p class="muted">${calendarNote}</p></section>
    <section><h4>Descriptions</h4>${notes}</section>
    <section><h4>Video Documentation${e.videos.length ? ' · ' + e.videos.length : ''}</h4>
    <div id="clip-content">${e.videos.length ? clipMarkup(e, id) : '<p class="muted">No video is linked to this record.</p>'}</div></section>
    </article>`;
}

function render() {
  const query = search.value.trim().toLowerCase();
  if (state.event) content.innerHTML = detail(state.event);
  else if (query) {
    const ids = Object.keys(events).filter(id => [id, events[id].title, events[id].date].some(value => value.toLowerCase().includes(query)));
    content.innerHTML = `<h3 class="section-label">${ids.length} ${ids.length === 1 ? 'result' : 'results'}</h3>` +
      (ids.length ? eventList(ids) : '<p class="muted">Try an event title, date or ID.</p>');
  } else content.innerHTML = state.tab === 'artists' ? artistIndex() : themeIndex();
}

function openEvent(id) {
  if (!state.event) state.scroll = scrollPanel.scrollTop;
  state.event = id;
  state.clip = 0;
  render();
  scrollPanel.scrollTop = 0;
  content.querySelector('h3').focus({ preventScroll: true });
  showNodes([id], events[id].title);
}

function restoreSelection() {
  if (state.tab === 'artists' && state.artist) {
    const artist = artists.find(a => a.id === state.artist);
    const message = artist.programme.length ? artist.name + ' · ' + artist.programme.length + ' documented roles'
      : artist.name + ' · No programme activity in this view';
    focusStrips(visitorProjects[artist.id] || [], message);
  } else if (state.tab === 'themes' && state.project) {
    focusStrips([state.project], projects[state.project].title);
  } else if (state.tab === 'themes' && state.theme) {
    focusStrips(Object.keys(projects).filter(id => projects[id].theme === state.theme),
      themes.find(t => t.id === state.theme).title);
  } else focusStrips([], 'All themes');
}

for (const tab of tabs) {
  tab.addEventListener('click', () => {
    state.tab = tab.dataset.tab;
    state.event = null;
    search.value = '';
    tabs.forEach(button => button.setAttribute('aria-pressed', String(button === tab)));
    render();
    scrollPanel.scrollTop = 0;
    restoreSelection();
  });
}

search.addEventListener('input', () => {
  if (state.event) {
    state.event = null;
    restoreSelection();
  }
  render();
  scrollPanel.scrollTop = 0;
});
document.querySelector('#reset').addEventListener('click', () => {state.event=null;state.project=null;state.artist=null;state.theme=null;search.value='';render();scrollPanel.scrollTop=0;focusStrips([], 'All 13 projects');});
document.querySelector('#artist-connections').addEventListener('click', enterArtists);

content.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  const { theme, project, artist, event: id, clip, back, play, relation } = button.dataset;
  if(relation){focusStrips([relation], (artists.find(a=>a.id===state.artist)?.name||'Project')+' · '+projects[relation].title);return;}
  if (id) {
    openEvent(id);
    return;
  }
  if (play !== undefined) {
    playClip();
    return;
  }
  if (clip !== undefined) {
    state.clip = Number(clip);
    document.querySelector('#clip-content').innerHTML = clipMarkup(events[state.event], state.event);
    content.querySelector(`[data-clip="${clip}"]`).focus({ preventScroll: true });
    return;
  }
  if (back !== undefined) {
    const previous = state.event;
    state.event = null;
    render();
    scrollPanel.scrollTop = state.scroll;
    content.querySelector(`[data-event="${previous}"]`)?.focus({ preventScroll: true });
    restoreSelection();
    return;
  }
  if (theme) {
    state.theme = state.theme === theme ? null : theme;
    state.project = null;
  }
  if (project) state.project = state.project === project ? null : project;
  if (artist) state.artist = state.artist === artist ? null : artist;
  render();
  content.querySelector(theme ? `[data-theme="${theme}"]` : project ? `[data-project="${project}"]` : `[data-artist="${artist}"]`)?.focus({ preventScroll: true });
  restoreSelection();
});

render();

// A collapsed index retains its selection, scroll position and open record.
const archiveToggle = document.querySelector('#archive-toggle');
const archivePanel = document.querySelector('#archive-panel');
archiveToggle.addEventListener('click', () => {
  cancelAnimationFrame(world.frame);
  const previousArea = world.W * world.H;
  archivePanel.hidden = !archivePanel.hidden;
  document.querySelector('.workspace').classList.toggle('index-collapsed', archivePanel.hidden);
  archiveToggle.setAttribute('aria-expanded', String(!archivePanel.hidden));
  archiveToggle.textContent = archivePanel.hidden ? 'Show index' : 'Hide index';
  // Preserve the camera centre and visible world area as the canvas grows.
  const nextArea = artBody.clientWidth * artBody.clientHeight;
  if (previousArea > 0 && nextArea > 0) world.z *= Math.sqrt(nextArea / previousArea);
});
