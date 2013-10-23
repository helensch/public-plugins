// Generated by CoffeeScript 1.5.0
(function() {
  var ACSensible, ac_name_a, ac_name_q, ac_string_a, ac_string_q, ajax_json, boost, direct_format, direct_order, direct_searches, favourite_species, favs, internal_site, jump_searches, jump_to, score_of, sections, sensible, sort_docs, sp_fav, sp_map, sp_names, _score;

  $.fn.getCursorPosition = function() {
    var input, sel, selLen;
    input = this.get(0);
    if (!input) {
      return;
    }
    if (input.selectionStart != null) {
      return input.selectionStart;
    } else if (document.selection) {
      input.focus();
      sel = document.selection.createRange();
      selLen = document.selection.createRange().text.length;
      sel.moveStart('character', -input.value.length);
      return sel.text.length - selLen;
    }
  };

  ACSensible = (function() {

    function ACSensible(nochange_ms, lastreq_ms, operation) {
      this.nochange_ms = nochange_ms;
      this.lastreq_ms = lastreq_ms;
      this.operation = operation;
      this.timeout = void 0;
      this.last_request = void 0;
      this.last_data = void 0;
      this.equal = function(a, b) {
        return a === b;
      };
      this.trigger();
    }

    ACSensible.prototype.set_equal_fn = function(equal) {
      this.equal = equal;
    };

    ACSensible.prototype.submit = function(data) {
      var now,
        _this = this;
      this.data = data;
      if (this.timeout) {
        clearTimeout(this.timeout);
      }
      this.timeout = setTimeout((function(v) {
        return _this.trigger(v);
      }), this.nochange_ms);
      now = new Date().getTime();
      if ((this.last_request == null) || now - this.last_request > this.lastreq_ms) {
        return this.trigger();
      }
    };

    ACSensible.prototype.trigger = function() {
      if (!this.equal(this.last_data, this.data)) {
        this.last_data = this.data;
        this.last_request = new Date().getTime();
        return this.operation(this.data);
      }
    };

    ACSensible.prototype.current = function() {
      return this.data;
    };

    return ACSensible;

  })();

  favs = void 0;

  sp_map = {};

  sp_fav = [];

  sp_names = function(name, callback) {
    if (sp_map[name] != null) {
      callback(sp_map[name], sp_fav);
      return;
    }
    return ajax_json("/Multi/Ajax/species", {
      name: name
    }, function(data) {
      var _ref;
      if (data.favs != null) {
        sp_fav = data.favs;
      }
      if ((_ref = data.result) != null ? _ref[0] : void 0) {
        sp_map[name] = data.result[0];
        return callback(data.result[0], sp_fav);
      } else {
        return callback(void 0, sp_fav);
      }
    });
  };

  favourite_species = function(element, callback) {
    var site, skip, url_name;
    skip = false;
    if (element != null) {
      site = element.parents('form').find("input[name='site']");
      if (site.length !== 0 && site.val() !== 'ensembl' && site.val() !== 'ensembl_all') {
        skip = true;
      }
    }
    if (!skip) {
      url_name = decodeURIComponent(window.location.pathname.split('/')[1]);
      if ((url_name == null) || url_name === 'Multi') {
        url_name = '';
      }
      return sp_names(url_name, function(names, favs) {
        var s;
        if (names != null) {
          return callback([names.common]);
        } else {
          return callback((function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = favs.length; _i < _len; _i++) {
              s = favs[_i];
              _results.push(s.common);
            }
            return _results;
          })());
        }
      });
    }
  };

  ajax_json = function(url, data, success) {
    return $.ajax({
      url: url,
      data: data,
      traditional: true,
      success: success,
      dataType: 'json',
      cache: false
    });
  };

  _score = {};

  score_of = function(doc, favs) {
    var score, sp, _ref;
    if (_score[doc.uid]) {
      return _score[doc.uid];
    }
    sp = $.inArray(doc.species, favs);
    sp = (sp > -1 ? favs.length - sp + 1 : 0);
    score = 200 * sp;
    score += 100 * $.inArray(doc.feature_type, direct_order);
    score += (((_ref = doc.location) != null ? _ref.indexOf('_') : void 0) !== -1 ? 0 : 10);
    score += (doc.database_type === 'core' ? 40 : 0);
    _score[doc.uid] = score;
    return score;
  };

  sort_docs = function(url, docs, favs, callback) {
    var d, entry, fmts, key, out, str, _i, _len;
    docs = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = docs.length; _i < _len; _i++) {
        d = docs[_i];
        _results.push(d.doc);
      }
      return _results;
    })();
    docs.sort(function(a, b) {
      return score_of(b, favs) - score_of(a, favs);
    });
    out = [];
    for (_i = 0, _len = docs.length; _i < _len; _i++) {
      d = docs[_i];
      fmts = direct_format[d.feature_type];
      if (fmts == null) {
        fmts = direct_format[''];
      }
      entry = {};
      for (key in fmts) {
        str = fmts[key];
        entry[key] = str.replace(/\{(.*?)\}/g, (function(m0, m1) {
          var _ref, _ref1;
          return (_ref = (_ref1 = d[m1]) != null ? _ref1 : d.id) != null ? _ref : 'unnamed';
        }));
      }
      entry.link = "/" + d.domain_url;
      out.push(entry);
    }
    return callback(out);
  };

  ac_string_q = function(url, q) {
    var data;
    q = q.toLowerCase();
    data = {
      q: q,
      spellcheck: true
    };
    return ajax_json(url, data);
  };

  ac_string_a = function(input, output) {
    var docs, q, _ref, _ref1, _ref2, _results;
    docs = (_ref = input.result) != null ? (_ref1 = _ref.spellcheck) != null ? (_ref2 = _ref1.suggestions[1]) != null ? _ref2.suggestion : void 0 : void 0 : void 0;
    if (docs == null) {
      return;
    }
    _results = [];
    while (docs.length) {
      q = docs.shift();
      _results.push(output.push({
        left: "Search for '" + q + "'",
        link: "/Multi/Search/Results?q=" + q,
        text: q
      }));
    }
    return _results;
  };

  direct_order = ['Phenotype', 'Gene'];

  direct_format = {
    Phenotype: {
      left: "{name}",
      right: '{species} Phenotype #{id}'
    },
    Gene: {
      left: "{name}",
      right: "<i>{species}</i> Gene {id}"
    },
    '': {
      left: "{name}",
      right: "{id} {feature_type}"
    }
  };

  direct_searches = [
    {
      ft: ['Phenotype'],
      fields: ['name*', 'description*']
    }, {
      ft: ['Gene'],
      fields: ['name*']
    }, {
      ft: ['Sequence'],
      fields: ['id'],
      minlen: 6
    }, {
      fields: ['id'],
      minlen: 6
    }
  ];

  jump_searches = [
    {
      fields: ['id'],
      minlen: 3
    }, {
      ft: ['Gene', 'Sequence'],
      fields: ['name']
    }
  ];

  boost = function(i, n) {
    if (n > 1) {
      return Math.pow(10, (2 * (n - i - 1)) / (n - 1));
    } else {
      return 1;
    }
  };

  ac_name_q = function(config, url, query, favs) {
    var data, f, fav, favqs, fk, ft_part, i, q, q_part, q_parts, s, t, wild, _i, _j, _k, _len, _len1, _len2, _ref;
    if (!$.solr_config('static.ui.enable_direct')) {
      return new $.Deferred().resolve();
    }
    query = query.toLowerCase();
    fav = "( " + ((function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = favs.length; _i < _len; _i++) {
        s = favs[_i];
        _results.push("species:\"" + s + "\"");
      }
      return _results;
    })()).join(" OR ") + " )";
    q = [];
    for (_i = 0, _len = config.length; _i < _len; _i++) {
      s = config[_i];
      if ((s.minlen != null) && query.length < s.minlen) {
        continue;
      }
      if (s.ft != null) {
        ft_part = ((function() {
          var _j, _len1, _ref, _results;
          _ref = s.ft;
          _results = [];
          for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
            t = _ref[_j];
            _results.push("feature_type:" + t);
          }
          return _results;
        })()).join(' OR ');
      }
      q_parts = [];
      _ref = s.fields;
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        f = _ref[_j];
        wild = false;
        f = f.replace(/\*$/, (function() {
          wild = true;
          return '';
        }));
        fk = (f === '' ? '' : f + ':');
        q_parts.push(fk + query);
        if (wild) {
          q_parts.push(fk + query + '*');
        }
      }
      q_part = q_parts.join(' OR ');
      if (q_parts.length > 1) {
        q_part = "( " + q_part + " )";
      }
      if (s.ft != null) {
        q.push("( ( " + ft_part + " ) AND " + q_part + " )");
      } else {
        q.push(q_part);
      }
    }
    favqs = [];
    for (i = _k = 0, _len2 = favs.length; _k < _len2; i = ++_k) {
      s = favs[i];
      favqs.push("species:\"" + s + "\"^" + boost(i, favs.length));
    }
    q = "( " + q.join(' OR ') + " ) AND ( " + favqs.join(" OR ") + " )";
    data = {
      q: q,
      fq: fav
    };
    return ajax_json(url, data);
  };

  ac_name_a = function(input, output) {
    var d, docs, _i, _len, _ref, _ref1, _results;
    docs = (_ref = input.result) != null ? (_ref1 = _ref.response) != null ? _ref1.docs : void 0 : void 0;
    if (docs == null) {
      return;
    }
    _results = [];
    for (_i = 0, _len = docs.length; _i < _len; _i++) {
      d = docs[_i];
      _results.push(output.push({
        doc: d
      }));
    }
    return _results;
  };

  jump_to = function(q) {
    var url;
    url = $('#se_q').parents("form").attr('action');
    url = url.split('/')[1];
    if (url === 'common') {
      url = 'Multi';
    }
    url = "/" + url + "/Ajax/search";
    return favourite_species(void 0, function(favs) {
      return $.when(ac_name_q(jump_searches, url, q, favs)).done(function(id_d) {
        var direct;
        direct = [];
        ac_name_a(id_d, direct);
        if (direct.length !== 0) {
          return window.location.href = '/' + direct[0].doc.domain_url;
        }
      });
    });
  };

  sensible = new ACSensible(500, 1000, function(data) {
    var q, url;
    url = $('#se_q').parents("form").attr('action');
    url = url.split('/')[1];
    if (url === 'common') {
      url = 'Multi';
    }
    url = "/" + url + "/Ajax/search";
    q = data.q;
    return favourite_species(data.element, function(favs) {
      return $.when(ac_string_q(url, q), ac_name_q(direct_searches, url, q, favs)).done(function(string_d, id_d) {
        var direct, out, searches;
        searches = [];
        direct = [];
        out = [];
        ac_string_a(string_d[0], searches);
        if (id_d != null ? id_d[0] : void 0) {
          ac_name_a(id_d[0], direct);
        }
        return sort_docs(url, direct, favs, function(sorted) {
          var d, s, _i, _j, _len, _len1;
          direct = sorted;
          for (_i = 0, _len = searches.length; _i < _len; _i++) {
            s = searches[_i];
            s.type = 'search';
          }
          for (_j = 0, _len1 = direct.length; _j < _len1; _j++) {
            d = direct[_j];
            d.type = 'direct';
          }
          out = searches.concat(direct);
          return data.response(out);
        });
      });
    });
  });

  internal_site = function(el) {
    var site;
    site = el.parents('form').find("input[name='site']").val();
    if (site) {
      return site === 'ensembl' || site === 'ensembl_all' || site === 'vega';
    } else {
      return true;
    }
  };

  sections = [
    {
      type: 'search',
      label: ''
    }, {
      type: 'direct',
      label: 'Direct Links'
    }
  ];

  $.widget('custom.searchac', $.ui.autocomplete, {
    _create: function() {
      var $b, box, d, eh, ew, ghost, oldval, p, pos, t, tr_gif, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3,
        _this = this;
      $b = $('body');
      if ($b.hasClass('ie67') || $b.hasClass('ie8') || $b.hasClass('ie9') || $b.hasClass('ie10')) {
        this.element.clone().addClass('solr_ghost').css('display', 'none').insertAfter(this.element);
        $.ui.autocomplete.prototype._create.call(this);
        return;
      }
      tr_gif = "url(data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==)";
      eh = this.element.height();
      ew = this.element.width();
      box = $('<div></div>').css({
        position: 'relative',
        display: 'inline-block',
        'vertical-align': 'bottom'
      }).width(ew).height(eh);
      _ref = ['left', 'right', 'top', 'bottom'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        d = _ref[_i];
        _ref1 = ['margin', 'padding'];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          p = _ref1[_j];
          box.css("" + p + "-" + d, this.element.css("" + p + "-" + d));
        }
        _ref2 = ['style', 'color', 'width'];
        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
          t = _ref2[_k];
          box.css("border-" + d + "-" + t, this.element.css("border-" + d + "-" + t));
        }
      }
      _ref3 = ['background-color'];
      for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
        p = _ref3[_l];
        box.css(p, this.element.css(p));
      }
      box.insertAfter(this.element);
      this.element.css('background-image', tr_gif).css('padding', 0).css('margin', 0).appendTo(box).css('border', 'none').css('outline', 'none').css('background-color', 'transparent');
      this.element.css({
        'z-index': 2,
        position: 'absolute'
      });
      pos = this.element.position();
      ghost = this.element.clone().css({
        'left': pos.left + "px",
        'top': pos.top + "px"
      }).css({
        position: 'absolute',
        'z-index': 1
      }).css({
        background: 'none'
      }).val('').addClass('solr_ghost').attr('placeholder', '').attr('id', '').insertBefore(this.element).attr('name', '');
      $.ui.autocomplete.prototype._create.call(this);
      oldval = this.element.val();
      this.element.on('change keypress paste focus textInput input', function(e) {
        var val;
        val = _this.element.val();
        if (val !== oldval) {
          if (ghost.val().substring(0, val.length) !== val) {
            ghost.val('');
          }
          return oldval = val;
        }
      });
      return this.element.on('keydown', function(e) {
        var gval, val;
        if (e.keyCode === 39) {
          val = _this.element.val();
          gval = ghost.val();
          if (gval && gval.substring(0, val.length) === val && _this.element.getCursorPosition() === val.length) {
            return _this.element.val(gval);
          }
        }
      });
    },
    _renderMenu: function(ul, items) {
      var i, rows, s, _i, _len, _results,
        _this = this;
      _results = [];
      for (_i = 0, _len = sections.length; _i < _len; _i++) {
        s = sections[_i];
        rows = (function() {
          var _j, _len1, _results1;
          _results1 = [];
          for (_j = 0, _len1 = items.length; _j < _len1; _j++) {
            i = items[_j];
            if (i.type === s.type) {
              _results1.push(i);
            }
          }
          return _results1;
        })();
        if (s.label && rows.length) {
          ul.append("<li class='search-ac-cat'>" + s.label + "</li>");
        }
        _results.push($.each(rows, (function(i, item) {
          return _this._renderItemData(ul, item);
        })));
      }
      return _results;
    },
    _renderItem: function(ul, item) {
      var $a;
      $a = $("<a class=\"search-ac\"></a>").html(item.left);
      if (item.right) {
        $a.append($('<em></em>').append(item.right));
      }
      return $("<li>").append($a).appendTo(ul);
    },
    options: {
      source: function(request, response) {
        if (internal_site(this.element)) {
          return sensible.submit({
            q: request.term,
            response: response,
            element: this.element
          });
        } else {
          return response([]);
        }
      },
      select: function(e, ui) {
        if (window.hub && window.hub.code_select) {
          if (ui.item.text) {
            $(e.target).val(ui.item.text);
            window.hub.update_url({
              q: ui.item.text
            });
            return false;
          } else if (ui.item.link) {
            window.hub.spin_up();
          }
        }
        if (ui.item.link) {
          return window.location.href = ui.item.link;
        }
      },
      focus: function(e, ui) {
        var ghost, val, _ref;
        ghost = $(e.target).parent().find('input.solr_ghost');
        val = $(e.target).val();
        if (((_ref = ui.item.text) != null ? _ref : '').substring(0, val.length) === val) {
          ghost.val(ui.item.text);
          ghost.css('font-style', $(e.target).css('font-style'));
        } else {
          ghost.val('');
        }
        return false;
      },
      close: function(e, ui) {
        var ghost;
        ghost = $(e.target).parent().find('input.solr_ghost');
        return ghost.val('');
      }
    }
  });

  $(function() {
    var form, url;
    form = $('#SpeciesSearch .search-form');
    if (!form.hasClass('homepage-search-form')) {
      url = $('#q', form).parents("form").attr('action');
      if (url) {
        url = url.split('/')[1];
        return $.solr_config({
          url: "/" + url + "/Ajax/config"
        }).done(function() {
          var ids, m, selbox, text, _i, _len, _ref, _ref1, _ref2;
          selbox = $('#q', form).parent();
          ids = [];
          text = [];
          _ref = $.solr_config('static.ui.facets.key=.members', 'feature_type');
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            m = _ref[_i];
            text.push((_ref1 = (_ref2 = m.text) != null ? _ref2.plural : void 0) != null ? _ref1 : m.key);
            ids.push(m.key);
          }
          ids.unshift("");
          text.unshift("Search all categories");
          return selbox.selbox({
            action: function(id, text) {
              return selbox.selbox("maintext", text);
            },
            selchange: function() {
              return this.centered({
                max: 14,
                inc: 1
              });
            },
            field: "facet_feature_type"
          }).selbox("activate", "", text, ids).selbox("select", "");
        });
      }
    }
  });

  window.sp_names = sp_names;

  window.solr_jump_to = jump_to;

}).call(this);
