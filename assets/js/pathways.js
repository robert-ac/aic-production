// Keep existing section deep links usable inside the optional detail panels.
function revealPathwayTarget(){
  const id=decodeURIComponent(location.hash.slice(1));
  if(!id)return;
  const target=document.getElementById(id);
  const details=target&&target.closest('details');
  if(details){details.open=true;requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));}
}
addEventListener('hashchange',revealPathwayTarget);
revealPathwayTarget();
