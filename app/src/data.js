/**
 * Created by yarden on 2/6/15.
 */
define(function(require) {

  var model = require('model');
  var d3 = require('d3');
  var queue = require('d3_queue');
  var Radio = require('radio');

  var MULTI_JOBS_COLOR = '#00ffff';
  var UNKNOWN_JOB_COLOR = '#a0a0a0';

  var runsInfo;
  var runs = d3.map();
  var colors = d3.scale.category10();
    //d3.scale.ordinal()
    //  .domain([0,10])
    //  .range(colorbrewer.Spectral[6]);

  function createRun(name) {
    var run = {
      groups: [],
      routers: new Map(),
      nodes: new Map(),
      counters: [],
      blues: new Map(),
      greens: new Map(),
      blacks: new Map(),
      links: new Map(),
      jobs: d3.map(),
      job_colors: new Map(),
      core_to_node: d3.map()
      };

    var g, r, c, node, rid = 0, cid = 0;

    for(g = 0; g < model.N_GROUPS; g++) {
      var group = {id: g, routers: [], mode: 'full'};
      run.groups.push(group);
      for(r = 0; r < model.N_ROWS; r++) {
        var row = [];
        group.routers.push(row);
        for(c = 0; c < model.N_COLS; c++) {
          var router = {
            id: model.router_id(g, r, c),
            g: g,  r:r,  c:c,
            jobs:[],
            color: UNKNOWN_JOB_COLOR
          };
          row.push(router);
          run.routers.set(router.id, router);
        }
      }
    }
    return run;
  }

  function loadRun(name) {
    var info = runsInfo.get(name);
    queue()
      .defer(d3.csv, info.jobs)
      .defer(d3.text, info.counters)
      .await(function (error, placement, counters) {
        if (error) {
          console.log("Error loading data", error);
        }
        else {
          var run = createRun(name);
          run.commFile = info.comm;
          //runs.set(name, run);
          loadPlacement(placement, run);
          loadCounters(counters, run);
          Backbone.Radio.channel('data').trigger('run', run);
        }
      });
  }

  function loadPlacement(data, run) {
    var job, router, color_idx=0;
    var i=-1, rank, n;
    var multi = 0;
    data.forEach(function (item) {
      i++;
      if (!item.core || item.core == 0) {
        rank = Math.round(i/24);
        if (i%24 > 0) {
          console.log('rank issue:', i, rank);}
        item.rank = rank;
        item.g = +item.g;
        item.r = +item.r;
        item.c = +item.c;
        item.n = +item.n;
        item.id = model.node_id(item);
        item.jobid = +item.jobid;
        if (item.jobid == undefined)
          console.log('undefined jobid');

        job = run.jobs.get(item.jobid);
        if (!job) {
          job = {id: item.jobid, n:0, color:colors(color_idx++)};
          console.log(job);
          run.jobs.set(item.jobid, job);
        }
        run.nodes.set(item.rank, item);

        router = run.routers.get(model.router_id(item));
        if (router.jobs.indexOf(job) == -1) {
          router.jobs.push(job);
          if (router.jobs.length == 1) router.color = job.color;
          else {
            router.color = MULTI_JOBS_COLOR;
            if (router.jobs.length == 2) multi++;
          }
        }
        job.n++;
      }
    });

    console.log('multi:',multi);

    console.log('placement: rank=',rank);
  }

  function loadCounters(data, run) {
    var i, n, values, sg, sr, sc, dg, dr, dc, color, j, nc, id, link;

    var rows = d3.csv.parseRows(data);
    run.countersNames = rows[0].slice(7);
    run.counters = [];
    n = rows.length;
    for (i = 1; i < n; i++) {
      values = rows[i];
      sg = +values.shift();
      sr = +values.shift();
      sc = +values.shift();
      dg = +values.shift();
      dr = +values.shift();
      dc = +values.shift();
      color = values.shift();
      nc = values.length;
      for (j = 0; j < nc; j++) {
        values[j] = +values[j];
      }
      link = {
        id: model.link_id(sg, sr, sc, dg, dr, dc),
        color: color,
        srcId: {g: sg, r: sr, c: sc},
        destId: {g: dg, r: dr, c: dc},
        src: run.routers.get(model.router_id(sg, sr, sc)),
        dest: run.routers.get(model.router_id(dg, dr, dc)),
        counters: values
      };
      if (color == 'b') run.blues.set(link.id, link);
      else if (color == 'g') run.greens.set(link.id, link);
      else run.blacks.set(link.id, link);

      run.links.set(link.id, link);
    }
  }

  var service = {};

  service.loadCatalog = function (file) {
    d3.csv(file, function(list) {
      //list.sort(function(a,b) {
      //  if (a.name < b.name) return -1;
      //  else if (a.name > b.name) return 1;
      //  return 0;
      //});
      list.forEach(function(item) {
        item.counters = '/data/'+item.counters;
        item.jobs = '/data/'+item.jobs;
        item.comm = item.comm && '/data/'+item.comm;
      });
      runsInfo = d3.map(list,  function(d) { return d.name;});
      Backbone.Radio.channel('data').trigger('runsList', list);
    });
    return this;
  };

  service.load = function (name) {
    var run = runs.get(name);
    if (!run) {
      loadRun(name);
    } else {
      Backbone.Radio.channel('data').trigger('run', run);
    }
    return this;
  };

  return service;
});