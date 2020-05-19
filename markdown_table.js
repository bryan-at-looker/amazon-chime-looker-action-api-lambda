
import {find, uniqBy, compact, filter} from 'lodash'
import {success, failure} from './libs/response-lib'
import {linkURL} from './helpers'

exports.main = async (event) => {   
  function webhook_post(webhook, data) {
    return new Promise((resolve, reject) => {
      
      const fetch = require('node-fetch');

      var options = {
        method: 'post',
        body: JSON.stringify({'Content': '/md '+data}),
        headers: { 'Content-Type': 'application/json' },
      }
 
      fetch(webhook, options)
      .then(res => res.json())
      .then(json => {
        resolve(json)
      })
      .catch(err =>{
        console.error(err);
        reject(err)
      })
    })
  }

  const body = JSON.parse(event.body);
  console.log(event.body)

  var j2md = require('json-to-markdown');

  var webhook = (body && body.data && body.form_params.webhook_override) ? body.form_params.webhook_override : body.data.webhook;

  var hostname = body.scheduled_plan.url.split('/').slice(0, 3).join('/');

  const details = (body.attachment && body.attachment.data) ? JSON.parse(body.attachment.data) : null

  const fields = (details && details.fields) ? details.fields : {} 

  const max_payload = 4096

  const array = ['dimensions','measures','table_calculations']
  var fields_out = []
  array.forEach(function (item, index) {
    if(fields[item] && fields[item].length>0) {
      for (var i=0; i<fields[item].length; i++) {
        var tmp = fields[item][i]
        tmp['_type'] = item
        tmp['_hidden'] = ( body.scheduled_plan.query && body.scheduled_plan.query.vis_config &&  body.scheduled_plan.query.vis_config.hidden_fields &&  body.scheduled_plan.query.vis_config.hidden_fields.indexOf(tmp.name) > -1 )
        fields_out.push(tmp)
      }
    }
  });

  var columns = []
  var out = []
  var data_len = details.data.length

  // loop through each row of data
  for (var k=0; k<data_len; k++) {

    var row = details.data[k];
    var temp = {};

    // loop through each key in JSON
    Object.keys(row).map(key => {

      // lookup the key in the fields collection
      var find_key = find(fields_out, { 'name': key});

      if (!find_key._hidden) {
       // find the label (short) of the field
       var label = (find_key) ? (find_key.label_short || find_key.label) : find_key.name;

       // find the rendered value
       var value = row[key].rendered || row[key].value;
 
       // if links are on, and the row has links, start the link generation
       if ( ['all','first'].indexOf(body.form_params.include_links) > -1 && row[key] && row[key].links) {
 
         // remove actions drills
         var tmp_links = filter(row[key].links, function(o) { return o.type != 'action'; })
 
         for (var j=0; j<tmp_links.length; j++) {
           if (j==0) {
             value = '['+value+'](' + linkURL(hostname,tmp_links [j].url) + ')';
           } else if (body.form_params.include_links == 'all') {
             value = value + ' [['+tmp_links [j].label+']](' + linkURL(hostname,tmp_links [j].url) + ')'
           }
 
         }
       }
       columns.push(label);
       temp[label] = value;       
      }
    });

    var temp_check = out.concat([temp]);
    var temp_check_bytes = ('/md '+ j2md(temp_check, uniqBy(columns))).length

    if (temp_check_bytes<=max_payload) {
      out.push(temp);
    } else {
      break;
    }
  }

  out = compact(out);

  var tableMdString = j2md(out, uniqBy(columns));

  // send title from action hub parameter
  try {
    if ( body.form_params.send_title == 'yes' ) {
      var q = await webhook_post(webhook, `[${body.scheduled_plan.title}](${body.scheduled_plan.url})` )
    }
    
    // send table
    var r = await webhook_post(webhook, tableMdString);
  
    if (k < data_len) {
      var s = await webhook_post(webhook, 'Showing '+k+'/'+data_len.toLocaleString('en-US')+' rows. [See all rows]('+body.scheduled_plan.url+')');
    }
  

    if (r && r.MessageId && r.RoomId) {
      return success({ looker: {success: true, message: r} })
    } else {
      return failure({ looker: {success: true, message: r} });
    }
  } catch (err) {
    return failure({ looker: {success: true, message: err} });
  }
}