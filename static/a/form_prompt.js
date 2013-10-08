// Creates multifield prompt modal window
// Depends (runtime) on ender/jeesh and Modal

function FormPrompt(options)
{
  options = options || {};

  this._title    = options.title;
  this._fields   = options.fields;
  this._controls = options.controls;

  this.sticky   = options.sticky || false;

  // some defaults
  this._classPrefix = 'formprompt';

  // state
  this.active = false;

  this._init();
}

FormPrompt.prototype.title = function FormPrompt_title(title)
{
  if (arguments.length > 0)
  {
    this.containerTitle.html(this._title = title);
  }

  return this._title;
}

FormPrompt.prototype.data = function FormPrompt_data(data)
{
  var classField   = [this._classPrefix, 'field'].join('_')
    , classFieldRE = new RegExp('\\b' + classField + '_([\\w_]+)\\b')
    ;

  if (typeof data == 'object')
  {
    this.containerFields.children().each(function(field)
    {
      var match;

      if ((match = field.className.match(classFieldRE)) && (match[1] in data))
      {
        $('textarea, input', field)[0].value = data[match[1]];
      }
    });
  }

  return this;
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
  $('.formprompt_field>input, .formprompt_field>textarea', this.container).each(function(el)
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
  this.container = $('<div class="'+this._classPrefix+'"></div>');
  this.prompt = $('<div class="'+[this._classPrefix, 'prompt'].join('_')+'"></div>').appendTo(this.container);

  // add title
  this.containerTitle = $('<h2 class="'+[this._classPrefix, 'title'].join('_')+'">'+(this._title || '')+'</h2>').appendTo(this.prompt);

  // add sub containers
  this.containerFields   = $('<div class="'+[this._classPrefix, 'fields'].join('_')+'"></div>').appendTo(this.prompt);
  this.containerControls = $('<div class="'+[this._classPrefix, 'controls'].join('_')+'"></div>').appendTo(this.prompt);

  // add fields
  if (this._fields)
  {
    for (i=0; i<this._fields.length; i++)
    {
      if (this._fields[i].type == 'textarea')
      {
        this.containerFields.append(this._makeTextarea(this._fields[i]));
      }
      else
      {
        this.containerFields.append(this._makeField(this._fields[i]));
      }
    }
  }

  // add controls
  for (i=0; i<this._controls.length; i++)
  {
    // controls go right to left
    this.containerControls.prepend(this._makeControl(this._controls[i]));
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
  var classes = [ [this._classPrefix, 'field'].join('_') , [this._classPrefix, 'field', field.name].join('_') ].join(' ')
    ;

  return $('<label class="'+classes+'">'+field.title+'<input type="'+(field.type || 'text')+'" name="'+field.name+'" value="'+(('value' in field) ? field.value : '')+'"'+(field.readonly ? ' readonly' : '')+'></label>');
}

FormPrompt.prototype._makeTextarea = function FormPrompt__makeTextarea(field)
{
  var classes = [ [this._classPrefix, 'field'].join('_') , [this._classPrefix, 'field', field.name].join('_') ].join(' ')
    ;

  return $('<label class="'+classes+'">'+field.title+'<textarea name="'+field.name+'"'+(field.readonly ? ' readonly' : '')+'>'+(('value' in field) ? field.value : '')+'</textarea></label>');
}


// creates control
FormPrompt.prototype._makeControl = function FormPrompt__makeControl(control)
{
  var classes = [ [this._classPrefix, 'control'].join('_') , [this._classPrefix, 'control', control.action].join('_') ].join(' ')
    ;

  return $('<button class="'+classes+'" data-action="'+control.action+'">'+control.title+'</button>');
}
