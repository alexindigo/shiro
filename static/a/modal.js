// Modal Window Helper
// Depends (runtime) on ender/jeesh (or another jQuery-alike library)

function Modal(options)
{
  var _modal = this
    ;

  options = options || {};

  // element to covert into modal
  this.element = options.element;

  // flag for true modal
  this.fixed = options.fixed || false;

  // flag for preventing deactivation with click on cover
  this.strict = options.strict || false;

  // active flag
  this.active = false;

  // cover storage
  this.coverElement = $('<div class="modal_cover"></div>');

  // set listeners
  this.listeners =
  {
    activate  : options.onActivate || function(){}, // fires when modal is activated
    deactivate: options.onDeactivate || function(){}  // fires when modal is deactivated
  };
}

// activates modal window
Modal.prototype.activate = function Modal_activate()
{
  if (this.active) return;

  // place modal cover
  this.coverElement.insertAfter(this.element);

  // deactivation listener
  // only if modal is not strict
  if (!this.strict)
  {
    this.coverElement.one('click.modal', this.deactivate.bind(this));

    // toggle the photos using the left/right arrow keys
    $(document).one('keydown.modal', this._keyboardHandler.bind(this));
  }

  // mark the element as being modal
  this.element.addClass('modal_is_modal');

  // prevent body from scrolling if it's fixed
  if (this.fixed)
  {
    $('body').addClass('modal_under_modal');
  }

  // it's officially active
  this.active = true;

  // let others know
  this.listeners.activate.call(this);
};

Modal.prototype.deactivate = function Modal_deactivate()
{
  // remove listeners
  this.coverElement.off('click.modal');
  $(document).off('keydown.modal');

  // cleanup modal elements
  this.coverElement.remove();
  $('body').removeClass('modal_under_modal');

  this.element.removeClass('modal_is_modal');

  // it's officially deactivated
  this.active = false;

  // let others know
  this.listeners.deactivate.call(this);
};

Modal.prototype._keyboardHandler = function Modal__keyboardHandler(e)
{
  if (!this.active) return;

  // check for key modifiers and skip if any
  if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

  // check if any input field is in focus
  if ($('input:focus, textarea:focus').length) return;

  // if escape – close
  if (e.which == 27)
  {
    e.preventDefault();
    this.deactivate();
  }
}
