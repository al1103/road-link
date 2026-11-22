const headers={'User-Agent':'RoadLink/0.1 source-research','Accept':'application/vnd.github+json'};
for(const repo of ['hvdwolf/SpeedAlert_Databases','DangLamTung/navbridge']) {
  const base=`https://api.github.com/repos/${repo}`;
  try {
    const meta=await fetch(base,{headers,signal:AbortSignal.timeout(20000)}).then(r=>r.json());
    const tree=await fetch(`${base}/git/trees/${meta.default_branch}?recursive=1`,{headers,signal:AbortSignal.timeout(20000)}).then(r=>r.json());
    console.log(JSON.stringify({repo,branch:meta.default_branch,updated:meta.pushed_at,license:meta.license?.spdx_id,files:tree.tree?.filter(x=>/license|readme|vietnam_(cameras|signs|speed)|overpass|police|database|config.json/i.test(x.path)).map(x=>({path:x.path,size:x.size})).slice(0,70)}));
    if(repo.startsWith('hvdwolf')) {
      const releases=await fetch(`${base}/releases?per_page=8`,{headers,signal:AbortSignal.timeout(20000)}).then(r=>r.json());
      console.log(JSON.stringify({repo,releases:Array.isArray(releases)?releases.filter(r=>r.tag_name.includes('asia')).map(r=>({tag:r.tag_name,date:r.published_at,assets:r.assets?.filter(a=>/^VN[.-]/i.test(a.name)).map(a=>({name:a.name,size:a.size,url:a.browser_download_url,digest:a.digest}))})):releases}));
    }
  }catch(e){console.log(JSON.stringify({repo,error:e.message}));}
}
