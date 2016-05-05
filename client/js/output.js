/**
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */

'use strict';

var $ = require('jquery');
var RenderMime = require('jupyter-js-ui/lib/rendermime');
var renderers = require('jupyter-js-ui/lib/renderers');
var PhWidget = require('phosphor-widget');

var DISPLAY_CLASS = 'jp-OutputArea-displayData';
var ERROR_CLASS = 'jp-Output-error';
var EXECUTE_CLASS = 'jp-OutputArea-executeResult';
var OUTPUT_AREA_CLASS = 'jp-OutputArea';
var OUTPUT_CLASS = 'jp-OutputArea-output';
var RESULT_CLASS = 'jp-OutputArea-result';
var STDERR_CLASS = 'jp-OutputArea-stderr';
var STDOUT_CLASS = 'jp-OutputArea-stdout';

// SETUP RENDERMIME

var rm = new RenderMime.RenderMime();
var transformers = [
    new renderers.JavascriptRenderer(),
    new renderers.MarkdownRenderer(),
    // HACK: !!!!!!
    // new renderers.HTMLRenderer(),
    {
        mimetypes: ['text/html'],
        render: function(mimetype, data) {
            var widget = new PhWidget.Widget();
            widget.onAfterAttach = function() {
                $(widget.node).html(data);
            };
            return widget;
        }
    },
    new renderers.ImageRenderer(),
    new renderers.SVGRenderer(),
    new renderers.LatexRenderer(),
    new renderers.ConsoleTextRenderer(),
    new renderers.TextRenderer()
  ];
transformers.forEach(function(t) {
    t.mimetypes.forEach(function(m) {
        rm.order.push(m);
        rm.renderers[m] = t;
    });
});

// OUTPUTAREA

var OutputArea = function() {
    this.clearNext = false;
    this.outputs = [];

    this.node = $('<div>').addClass(OUTPUT_AREA_CLASS).get(0);
};

OutputArea.prototype = $.extend(OutputArea.prototype, {
    // attach: function(parentNode) {
    // },

    add: function(output) {
        if (this.clearNext) {
            this.clear();
            this.clearNext = false;
        }

        this.outputs.push(output);
        $(this.node).addClass(OUTPUT_CLASS);

        var bundle;
        var className;
        switch (output.output_type) {
            case 'stream': {
                bundle = {
                    'application/vnd.jupyter.console-text': output.text
                };
                className = output.name === 'stdout' ? STDOUT_CLASS : STDERR_CLASS;
                break;
            }
            case 'display_data': {
                bundle = output.data;
                className = DISPLAY_CLASS;
                break;
            }
            case 'execute_result': {
                bundle = output.data;
                className = EXECUTE_CLASS;
                break;
            }
            case 'error': {
                var traceback = output.traceback.join('\n');
                var errtext = traceback || output.ename + ': ' + output.evalue;
                bundle = {
                    'application/vnd.jupyter.console-text': errtext
                };
                className = ERROR_CLASS;
                break;
            }
            default: {
                console.error('unhandled output area type');
            }
        }

        var child = rm.render(bundle);
        if (child) {
            this.node.appendChild(child.node);
            $(child.node).addClass(RESULT_CLASS);
        } else {
            console.error('No renderer found for type ' + output.output_type);
        }

        if (className) {
            $(this.node).addClass(className);
        }
    },

    clear: function(wait) {
        if (wait) {
            this.clearNext = true;
        } else {
            this.node.innerHTML = '';
        }
    }
});

module.exports = OutputArea;
