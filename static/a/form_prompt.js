// Creates multifield prompt modal window
// Depends (runtime) on ender/jeesh and Modal

function FormPrompt(options)
{
  options = options || {};

  this.title    = options.title;
  this.fields   = options.fields;
  this.controls = options.controls;

  this.sticky   = options.sticky || false;

  // some defaults
  this.classPrefix = 'formprompt';

  // state
  this.active = false;

  this._init();
}


FormPrompt.prototype.activate = function FormPrompt_activate(callback)
{
  if (this.active) return;

  // insert form element
  $('body').append(this.container);

  // activate modal
  this._modal.activate();

  this.active = true;

  // store callback
  this._callback = callback;
}

FormPrompt.prototype.deactivate = function FormPrompt_deactivate(action)
{
  var fields = {};

  if (!this.active) return;

  // gather data
  $('.formprompt_field>input', this.container).each(function(el)
  {
    fields[el.name] = el.value;
    // clean up
    el.value = '';
  });

  // fire callback
  if (action && typeof this._callback == 'function')
  {
    // TODO: Add feedback
    this._callback(action, fields);
  }

  // shutdown sticky modal only when called without action
  // means from the script
  if (!this.sticky || !action)
  {
    // prevent feedback loop
    this.active = false;

    // clean up callback
    this._callback = undefined;

    // check modal
    if (this._modal.active)
    {
      this._modal.deactivate();
    }

    // remove prompt
    this.container.remove();
  }
}

// Shows message within prompt
FormPrompt.prototype.showMessage = function FormPrompt_showMessage(message)
{
  // TODO:
}

// --- demi-private

// populates form with fields
FormPrompt.prototype._init = function FormPrompt__init()
{
  var _form = this
    , i
    ;

  // create form container and fields
  this.container = $('<div class="'+this.classPrefix+'"></div>');
  this.prompt = $('<div class="'+[this.classPrefix, 'prompt'].join('_')+'"></div>').appendTo(this.container);

  // add title
  if (this.title)
  {
    this.prompt.append('<h2 class="'+[this.classPrefix, 'title'].join('_')+'">'+this.title+'</h2>');
  }

  // add sub containers
  this.containerFields   = $('<div class="'+[this.classPrefix, 'fields'].join('_')+'"></div>').appendTo(this.prompt);
  this.containerControls = $('<div class="'+[this.classPrefix, 'controls'].join('_')+'"></div>').appendTo(this.prompt);

  // add fields
  for (i=0; i<this.fields.length; i++)
  {
    this.containerFields.append(this._makeField(this.fields[i]));
  }

  // add controls
  for (i=0; i<this.controls.length; i++)
  {
    // controls go right to left
    this.containerControls.prepend(this._makeControl(this.controls[i]));
  }

  // add event handlers
  this.containerControls.on('click', 'button', function(e)
  {
    _form.deactivate($(this).data('action'));
  });

  // setup modal
  this._modal = new Modal(
  {
    strict      : true,
    fixed       : true,
    element     : this.container
  });
}

// creates field
FormPrompt.prototype._makeField = function FormPrompt__makeField(field)
{
  var classes = [ [this.classPrefix, 'field'].join('_') , [this.classPrefix, 'field', field.name].join('_') ].join(' ')
    ;

  return $('<label class="'+classes+'">'+field.title+'<input type="'+(field.type || 'text')+'" name="'+field.name+'" value="'+(('value' in field) ? field.value : '')+'"></label>');
}

// creates control
FormPrompt.prototype._makeControl = function FormPrompt__makeControl(control)
{
  var classes = [ [this.classPrefix, 'control'].join('_') , [this.classPrefix, 'control', control.action].join('_') ].join(' ')
    ;

  return $('<button class="'+classes+'" data-action="'+control.action+'">'+control.title+'</button>');
}
