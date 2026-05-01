const fs = require('fs');

function fixFile(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');
  // Replaces ANY non-ASCII sequence (like Â©, â€”, etc) with a temporary marker, OR we can just explicitly replace the common ones.
  // Actually, let's just use exact string replacement for the corrupted UTF8.
  
  // The corrupted UTF-8 for EM DASH is "Ã¢â‚¬â€ " or "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â "
  c = c.replace(/ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â /g, '&mdash;');
  c = c.replace(/Ã¢â‚¬â€ /g, '&mdash;');
  
  // The corrupted UTF-8 for right arrow is "ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢"
  c = c.replace(/ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢/g, '&rarr;');
  
  // The corrupted UTF-8 for right single quote is "Ã¢â‚¬â„¢"
  c = c.replace(/Ã¢â‚¬â„¢/g, '&rsquo;');
  
  // And just in case, catch the remaining weird ones we saw in grep
  c = c.replace(/Start Your Project [^\<]+/g, 'Start Your Project &rarr;');
  c = c.replace(/<span class="arrow">[^\<]+<\/span>/g, '<span class="arrow">&rarr;<\/span>');
  
  // Marquee
  c = c.replace(/SOLUTIONS [^\s]+ DESIGN [^\s]+ EXECUTE [^\s]+ DELIVER [^\s]+ URBAN/g, 'SOLUTIONS &mdash; DESIGN &mdash; EXECUTE &mdash; DELIVER &mdash; URBAN');
  c = c.replace(/DELIVER [^\s]+ /g, 'DELIVER &mdash; ');
  c = c.replace(/ARCHITECTURE [^\s]+ PLANNING [^\s]+ CONSTRUCTION [^\s]+ EXCELLENCE [^\s]+ ARCHITECTURE/g, 'ARCHITECTURE &mdash; PLANNING &mdash; CONSTRUCTION &mdash; EXCELLENCE &mdash; ARCHITECTURE');
  c = c.replace(/EXCELLENCE [^\s]+ /g, 'EXCELLENCE &mdash; ');
  
  c = c.replace(/realities [^\s]+ orchestrating/g, 'realities &mdash; orchestrating');
  c = c.replace(/project [^\s]+ anticipating/g, 'project &mdash; anticipating');
  c = c.replace(/completion [^\s]+ each/g, 'completion &mdash; each');
  c = c.replace(/delivery [^\s]+ ensuring/g, 'delivery &mdash; ensuring');
  c = c.replace(/Quetta [^\s]+ delivering/g, 'Quetta &mdash; delivering');
  c = c.replace(/Phase II [^\s]+ a large/g, 'Phase II &mdash; a large');
  c = c.replace(/Phase III [^\s]+ Islamabad/g, 'Phase III &mdash; Islamabad');
  c = c.replace(/Islamabad [^\s]+ a premium/g, 'Islamabad &mdash; a premium');
  c = c.replace(/Enclave [^\s]+ CDA/g, 'Enclave &mdash; CDA');
  c = c.replace(/compliance [^\s]+ navigating/g, 'compliance &mdash; navigating');
  c = c.replace(/Solutions [^\s]+ from plan/gi, 'Solutions ensures your success &mdash; from plan');
  c = c.replace(/Solutions [^\s]+ From Plan/g, 'Solutions &mdash; From Plan');
  
  c = c.replace(/Studies [^\s]+ The/g, 'Studies &mdash; The');
  c = c.replace(/Pakistan[^\s]+s next/g, 'Pakistan&rsquo;s next');
  c = c.replace(/Rawalpindi[^\s]+s/g, 'Rawalpindi&rsquo;s');
  c = c.replace(/Islamabad[^\s]+s/g, 'Islamabad&rsquo;s');
  c = c.replace(/FUTURE PROOFING [^\s]+ REGULATORY PRECISION [^\s]+ SOCIO-ECONOMIC UPLIFT [^\s]+ FEASIBILITY-FIRST DESIGN [^\s]+/g, 'FUTURE PROOFING &mdash; REGULATORY PRECISION &mdash; SOCIO-ECONOMIC UPLIFT &mdash; FEASIBILITY-FIRST DESIGN &mdash;');

  // Remove any remaining generic non-ascii chars that aren't inside tags
  c = c.replace(/([\w]+)[^\x00-\x7F]+([\w]+)/g, '$1&mdash;$2'); 
  
  fs.writeFileSync(filePath, c, 'utf8');
}

fixFile('index.html');
fixFile('casestudies/index.html');
