/******/ (() => { // webpackBootstrap

/******/ 	"use strict";

var __webpack_exports__ = {};



;// CONCATENATED MODULE: ./_src/automatic-order-tasks/components.js

const components = ($) => {



  const { __ } = wp.i18n;



  function template_headline(statusName) {

    return `<h2>${__('When an order reaches the status', 'aotfw-domain')}<div class="status-name">${statusName}</div></h2>`;

  }



  function template_tasksContainer(statusValue) {

    return `<div id="order-tasks-container" data-id="${statusValue}">

            <div class="loader"><div class="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div></div>

            <div class="notask-placeholder" style="display: none;">${__('No tasks are set for this order status.<br>Click the button below to add your first one!', 'aotfw-domain')}</div>

            </div>`;

  }



  function template_newTaskButton() {

    return `<button type="button" class="eam-button" id="new-task-btn"><i class="fa-solid fa-plus" style="margin-right: 5px; font-size: .84em"></i>${__('New Task', 'aotfw-domain')}</button>`;

  }



  function template_saveChangesButton() {

    return `<button type="button" class="eam-button" id="save-changes-btn"><i class="fa-solid fa-floppy-disk" style="margin-right: 6px;"></i>${__('Save Changes', 'aotfw-domain')}</button>`

  }



  return {

    createBaseComponents: ($statusSelect) => {

      const $container = $('#eam-order-options');

      $container.children().remove();



      const $selectedStatus = $statusSelect.find('option:selected');



      // create html elements

      const statusName = $selectedStatus.text();

      $container.append(template_headline(statusName));



      const statusValue = $selectedStatus.val();

      const $orderTasksContainer = $(template_tasksContainer(statusValue));



      $container.append($orderTasksContainer);



      const $newTaskBtn = $(template_newTaskButton());

      $container.append($newTaskBtn);



      const $saveChangesBtn = $(template_saveChangesButton());

      $container.append($saveChangesBtn);



      const $viewLogLink = $('#view-log-link');



      return {

        newTaskBtn: $newTaskBtn,

        saveChangesBtn: $saveChangesBtn,

        orderTasksContainer: $orderTasksContainer,

        viewLogLink: $viewLogLink

      }

    },



    createNewTaskWindow: (tasks, onTaskSelectCallback) => {

      const $taskWindow = $('<div class="backdrop-overlay"><div class="new-task-window"><div class="grid-container"></div><div class="close-btn"><i class="fa-solid fa-xmark"></i></div></div></div>');



      let taskLinks = [];

      for (const task of tasks) {

        const taskMeta = task.getMeta();



        const $taskGrid = $(

        `<div class="task-selector-unit" id="${taskMeta.id}" data-id="${taskMeta.id}">

          <div class="task-icon"><i class="${taskMeta.icon}"></i></div>

          <div class="task-text">${taskMeta.text}</div>

        </div>`);



        $taskGrid.on('click', function() {

          $taskWindow.remove();

          onTaskSelectCallback(task);

        });



        taskLinks.push($taskGrid);

      }



      //TODO: remove this temporary solution placeholder at a later stage

      for (let i = 0; i<2; i++) {

        const $taskGrid = $(`<div class="task-selector-unit placeholder"></div>`);

        taskLinks.push($taskGrid);

      }

      //END



      const $tasksContainer = $taskWindow.find('.grid-container');

      taskLinks.forEach( x => $tasksContainer.append(x) );



      $taskWindow.find('.close-btn').on('click', function() {

        $taskWindow.remove();

      });



      $('body').append($taskWindow);

    }

  }

}





const instance = components(jQuery);

/* harmony default export */ const automatic_order_tasks_components = (instance);

;// CONCATENATED MODULE: ./_src/automatic-order-tasks/ajax-api.js

const ajaxAPI = () => {

  let cache_map = {};



  function doAjax(data = {}, method = 'GET', cacheID) {



    return new Promise((resolve, reject) => {

      if (cacheID && cache_map[cacheID]) { // get cached data if any, to avoid unnecessary ajax calls.

        resolve(cache_map[cacheID]);

        return;

      }



      data._ajax_nonce = eam_nonce;



      jQuery.ajax({

        url: ajaxurl,

        method: method,

        data: data,

        dataType: 'json',

        success: function(data) {

          if (cacheID) {

            cache_map[cacheID] = data;

          }

          resolve(data);

        },

        error: function(error) {

          reject(error);

        }

      });

    });

  }



  return {



    getOrderManagementConfig: (id) => {

      return doAjax( {

        action: 'eam_get_order_tasks_config',

        id: id

      } );

    },



    saveOrderStatusConfig: (data) => {

      return doAjax( {

        action: 'eam_post_order_tasks_config',

        data: data

      }, 'POST' );

    },



    getPostCategories: () => {

      return doAjax( {

        action: 'eam_get_post_categories'

      }, 'GET', 'post_categories' );

    },



    getUsers: () => {

      return doAjax( {

        action: 'eam_get_users'

      }, 'GET', 'users' );

    },



    getShippingMethods: () => {

      return doAjax( {

        action: 'eam_get_shipping_methods'

      }, 'GET', 'shipping_methods' );

    }

  }

}



const ajax_api_instance = ajaxAPI();

/* harmony default export */ const ajax_api = (ajax_api_instance);

;// CONCATENATED MODULE: ./_src/automatic-order-tasks/data-manager.js







const dataManager = ($) => {

  let dirty = false;



  return {

    load: () => {

      return new Promise((resolve, reject) => {

        const statusID = $('#order-tasks-container').data('id');



        ajax_api.getOrderManagementConfig(statusID)

        .then(data => {



          //remove spinner

          $('.loader').remove();



          if (Array.isArray(data) && data.length) { // add tasks

            for (const taskConfig of data) {

              const task = orderTaskFactory.get(taskConfig.id);

              task.createFields(taskConfig);

            }

          } else { // show placeholder text

            $('.notask-placeholder').show();

          }

          dirty = false; // all the settings have just been loaded, so dirty is false.

          resolve();

        })

        .catch(err => {

          reject(err);

        })

      })

    },



    save: () => {

      return new Promise((resolve, reject) => {



      // get task manager container

      const $taskManager = $('#order-tasks-container');

      const $tasks = $taskManager.find('.eam-task');

      const configArr = [];

 

      $tasks.each(function() {

        const $task = $(this);



        const taskId = $task.data('id');



        // get the meta settings

        const $metaSettings = $task.find('.eam-task-meta-setting');

        const metaSettingsVals = {};

        $metaSettings.each(function() {

          const $metaSetting = $(this);

          const metaSettingId = $metaSetting.data('id');



          // determine how to extract value based on input type

          const type = this.type;

          if (type === 'checkbox') {

            metaSettingsVals[metaSettingId] = $metaSetting.prop('checked');

          } else {

            metaSettingsVals[metaSettingId] = $metaSetting.val();

          }



        });



        // get the config fields

        const $fields = $task.find('.eam-field');



        const fieldVals = {};

        $fields.each(function() {

          const $field = $(this);

          

          const fieldId = $field.data('id');

          fieldVals[fieldId] = $field.data('meta').getValue() ;

        });

        configArr.push({ id: taskId, fields: fieldVals, metaSettings: metaSettingsVals });



      });



      const configJSON = JSON.stringify({ orderStatus: $taskManager.data('id'), config: configArr  });



      ajax_api.saveOrderStatusConfig(configJSON)

          .then(data => {

            dirty = false;

            resolve(data);

          })

          .catch(err => {

            reject(err);

          });

      });

    },



    setDirty: () => {

      dirty = true;

    },



    isDirty: () => {

      return dirty;

    }

  }

};





const data_manager_instance = dataManager(jQuery);

/* harmony default export */ const data_manager = (data_manager_instance);

;// CONCATENATED MODULE: ./_src/automatic-order-tasks/field-generator.js





function FieldGenerator($) {

  const { __ } = wp.i18n;



  const _FIELD_TYPE = {

    PLAIN: 1,

    EMAIL: 2,

    HTML: 3,

    SELECT: 4,

    SELECT_MULTIPLE: 5,

    TEXTAREA: 6

  }



  function getPlain(id, label, params) {

    const $html = $(

      `<div>

        <label for="${id}">${label}</label>

        <input type="text" name="${id}">

        </input>

    </div>`);



    if (params) {

      const $params = getParamDiv(params);

      $html.append($params);

  

      // on add parameter

      $params.children().on('click', function () {

        const $input = $html.find('input');

        // perform some trimming on the previous value before adding the parameter

        const prevVal = $input.val().length ? $input.val().trimEnd() + ' ' : '';

        $input.val(prevVal + `{{${$(this).text()}}}`);

      });

    }



    const setup = () => {

      const $input = $html.find('input');

      $input.on('change', function() {

        data_manager.setDirty();

      });





    }



    const getValue = () => {

      return $html.find('input').val();

    }



    const setValue = (value) => {

      $html.find('input').val(value);

    }



    const $meta = { content: $html, setup: setup, getValue: getValue, setValue: setValue };



    return $meta;

  }





  function getEmail(id, label, params) {

    const $html = $(

      `<div>

        <label for="${id}">${label}</label>

        <select name="${id}" multiple="multiple">

        </select>

      </div>`

    )

    const $params = getParamDiv(params);

    $html.append($params);



    const setup = () => {

      const $select = $html.find('select');



      $select.on('change', function() {

        data_manager.setDirty();

      });



      $select.select2({

        tags: true,

        selectOnClose: true,

        allowClear: true,

        placeholder: __('Type email addresses here, or use a dynamic tag from below.', 'aotfw-domain'),

        tokenSeparators: [',', ' '],

        createTag: function (params) {

          const term = params.term;

          if (term.indexOf('@') === -1 && (term.indexOf('{{') === -1 || term.indexOf('}}') === -1)) {

            return null;

          }



          return {

            id: params.term,

            text: params.term.replace(/{{|}}/g, '')

          }

        }

      }).on('select2:open', function (e) {

        $('.select2-container--open .select2-dropdown--below').css('display', 'none');

      });

      $select.on('change', function (e) {

        $select.trigger('select2:change', e);

      });



      // fixes yet another select2 bug

      const $select2El = $select.siblings('.select2');

      const width = '100%';

      $select2El.find('input').css('width', width);



      // parameters

      $params.children().on('click', function () {

        const $select = $html.find('select');

        const data = $select.select2('data');



        const textValToAdd = $(this).text();

        for (var d of data) {

          if (d.text == textValToAdd) {

            return; // escape out of function if the added value already exists

          }

        }



        const newList = $.merge(data, [{

          id: `{{${$(this).text()}}}`,

          text: $(this).text()

        }]);



        $select.select2('data', newList);



        const optionsHtml = (() => {

          let html = '';

          for (var tag of newList) {

            html += `<option value="${tag.id}" data-select2-tag="true">${tag.text}</option>`;

          }

          return html;

        })();



        $select.html(optionsHtml);

        $select.val(newList.map(o => o.id));



        $select.trigger('change');



      });

    }



    const getValue = () => {

      return $html.find('select option').map(function () {

        return {

          label: $(this).text(),

          value: $(this).val()

        }

      }).get();

    }



    const setValue = (value) => {

      if ( !value.length ) return;



      const $select = $html.find('select');

      for (const opt of value) {

        $select.append(`<option value="${opt.value}" data-select2-tag="true">${opt.label}</option>`);

      }



      $select.val(value.map(o => o.value));

      $select.trigger('change');

    }



    const $meta = { content: $html, setup: setup, getValue: getValue, setValue: setValue };



    return $meta;

  }





  function getHtmlEditor(id, label, params) {

    const $html = $(

      `<div class="editor-container" name="${id}"></div>`);



    const setup = () => {

      let Embed = Quill.import('blots/embed');



      class Breaker extends Embed {

          static tagName = 'br';

          static blotName = 'breaker';

      }

      

      Quill.register(Breaker);



      const quill = new Quill($html[0], {

        modules: {

          toolbar: [

            [{ header: [1, 2, 3, false] }],

            ['bold', 'italic', 'underline']

          ],

          keyboard: {

            bindings: {

              linebreak: {

                key: 13,

                shiftKey: true,

                handler: function(range) {

                  this.quill.insertEmbed(range.index, 'breaker', true, Quill.sources.USER);

                  this.quill.setSelection(range.index + 1, Quill.sources.SILENT);

                  return false;

                }

              }

            }

          }

        },

        theme: 'snow',

      

      });



      // TODO: listening for text change in quill does work, but it seems to run async,

      // which is a problem as other listeners for setdirty don't. So - it is disabled until

      // a way around it can be found. i.e. some kind of global listener waiting for all

      // config to be done and then setdirty false.

      // quill.on('text-change', function() {

      //   dm.setDirty();

      // }) 



      const $params = getParamDiv(params);

      $html.wrap('<div></div>');

      $html.parent().parent().prepend(`<label for="${id}">${label}</label>`);

      $html.parent().append($params);



      // on add parameter

      $params.children().on('click', function () {

        const selection = quill.getSelection(true);

        quill.insertText(selection.index, `{{${$(this).text()}}}`);

      });



      // bind quill to the element

      $html.data('quill', quill);



    };



    const getValue = () => {

      return $html.find('.ql-editor').html();

    }



    const setValue = (value) => {

      $html.find('.ql-editor').html(value); // value has been sanitized before using

    }



    const $meta = { content: $html, setup: setup, getValue: getValue, setValue: setValue };



    return $meta;

  }



  function getSelect(id, label, info) {

    const $html = $(

      `<div>

        <label for="${id}">${label}</label>

        <select type="text" name="${id}">

        </select>

    </div>`);



    if (info) {

      $html.append(`<div class="info">${info}</div>`);

    }



    const setup = () => {

      const $select = $html.find('select');



      $select.select2();

      $select.on('change', function (e) {

        $select.trigger('select2:change', e);

        data_manager.setDirty();

      });

    }



    const getValue = () => {

      return $html.find('select').val();

    }



    const setValue = (value) => {

      const $select = $html.find('select');

      $select.val(value);

    }



    const $meta = { content: $html, setup: setup, getValue: getValue, setValue: setValue };



    return $meta;

  }



  function getSelectMulti(id, label, info) {

    const $html = $(

      `<div>

        <label for="${id}">${label}</label>

        <select type="text" multiple="multiple" name="${id}">

        </select>

    </div>`);



    if (info) {

      $html.append(`<div class="info">${info}</div>`);

    }



    const setup = () => {

      const $select =  $html.find('select');

      $select.select2();



      $select.on('change', function() {

        data_manager.setDirty();

      })

    }



    const getValue = () => {

      return $html.find('select').val();

    }



    const setValue = (value) => {

      const $select = $html.find('select');

      $select.val(value);

    }



    const $meta = { content: $html, setup: setup, getValue: getValue, setValue: setValue };



    return $meta;

  }



  function getTextArea(id, label, params) {

    const $html = $(

      `<div>

        <label for="${id}">${label}</label>

        <textarea name="${id}"></textarea>

    </div>`);



    const $params = getParamDiv(params);

    $html.append($params);



    const setup = () => {

      const $textarea = $html.find('textarea');



      $textarea.on('change', function() {

        data_manager.setDirty();

      })



      // on add parameter

      $params.children().on('click', function () {

        const $input = $textarea;



        // perform some trimming on the previous value before adding the parameter

        const prevVal = $input.val().length ? $input.val().trimEnd() + ' ' : '';

        $input.val(prevVal + `{{${$(this).text()}}}`);

      });

    }



    const getValue = () => {

      return $html.find('textarea').val();

    }



    const setValue = (value) => {

      $html.find('textarea').val(value);

    }



    const $meta = { content: $html, setup: setup, getValue: getValue, setValue: setValue };



    return $meta;

  }



  function getParamDiv(params) {

    if (!params) return;

    

    const $html = $('<div class="eam-params"></div>');



    if (params.length) {

      const paramsHtml = params.map(p => `<span>${p}</span>`);

      $html.append(paramsHtml);

    }



    return $html;

  }



  return {

    FIELD_TYPE: (() => {

      Object.freeze(_FIELD_TYPE);

      return _FIELD_TYPE;

    })(),



    getField: (id, label, fieldType, params = null, info) => {



      let $el = ''; // note: We might want to convert it to a map later. e.g. fubar[fieldType] = function we want

      switch (fieldType) {

        case _FIELD_TYPE.PLAIN:

          $el = getPlain(id, label, params);

          break;

        case _FIELD_TYPE.EMAIL:

          $el = getEmail(id, label, params);

          break;

        case _FIELD_TYPE.HTML:

          $el = getHtmlEditor(id, label, params);

          break;

        case _FIELD_TYPE.SELECT:

          $el = getSelect(id, label, info);

          break;

        case _FIELD_TYPE.SELECT_MULTIPLE:

          $el = getSelectMulti(id, label, info);

          break;

        case _FIELD_TYPE.TEXTAREA:

          $el = getTextArea(id, label, params);

          break;

        default:

          throw new Error('no such fieldtype');

      }



      const container = $(`<div class="eam-field" data-id="${id}"></div>`);

      container.append($el.content);

      container.data('meta', $el);



      return { container: container, ...$el };

    },



  };

}



const field_generator_instance = FieldGenerator(jQuery);

/* harmony default export */ const field_generator = (field_generator_instance);

;// CONCATENATED MODULE: ./_src/automatic-order-tasks/task-meta-settings.js





const taskMetaSettings = (config) => {

  const { __ } = wp.i18n;

  const $ = jQuery;



  if (!config) config = [];



  function template_headline() {

    return `<strong class="task-meta-settings-headline">${__('Task Settings', 'aotfw-domain')}</strong>`;

  }



  function template_okBtn() {

    return `<button class="eam-button task-meta-settings-ok-btn">${__('OK', 'aotfw-domain')}</button>`;

  }



  function template_settingRunOnce() {

    const checked = config['runonce'] === true ? 'checked' : '';

    return `

    <label><input type="checkbox" ${checked} class="eam-task-meta-setting" data-id="runonce" name="task-meta-runonce"></input> ${__('Only run once', 'aotfw-domain')}</label>

    <span class="eam-tooltip">?<span class="tooltip-text">${__('Limits the task to only run the first time the order reaches the order status.', 'aotfw-domain')}</span></span>

    `;

  }



  return {



    getContent: () => {

      const $container = $(`<div class="eam-task-meta-settings-container" style="display: none;"></div>`);



      $container.append(template_headline);



      const $setting_runOnce = $(template_settingRunOnce());

      $setting_runOnce.on('change', function() { data_manager.setDirty(); })

      $container.append($setting_runOnce);



      const $okBtn = $(template_okBtn());

      

      $okBtn.on('click', function() { // hide option window on click

        $(this).parent().css('display', 'none');

      });



      $container.append($okBtn);



      return $container;

    }

  }

}



/* harmony default export */ const task_meta_settings = (taskMetaSettings);

;// CONCATENATED MODULE: ./_src/automatic-order-tasks/tasks.js











const { __ } = wp.i18n;

const $ = jQuery;



class BaseOrderTask {

  _meta = null;



  constructor(id, icon, text) {

    this._meta = {

      id: id,

      icon: icon,

      text: text

    }

  }



  getMeta() {

    return this._meta;

  }



  getTasksContainer() {

    return $('#order-tasks-container');

  }



  getDefaultTagsForTextarea() {

    return ['order id', 'order details', 'billing email', 'billing name', 'billing phone', 'billing company', 'billing address', 'shipping name', 'shipping address', 'order note'];

  }



  getDefaultTagsForField() {

    return ['order id', 'billing name', 'billing phone', 'billing company', 'shipping name'];

  }



  createFields(params = null) {

    throw new Error("Method 'createFields()' must be implemented.");

  }



  _getFieldGroup(config = null) {

    const $fieldGroup = $(`<div data-id="${this.getMeta().id}" class="accordion-panel eam-task"></div>`);



    // get the global settings container



    const taskMetaSettings = config ? task_meta_settings(config['metaSettings'] ) : task_meta_settings(null);

    const $taskMetaSettingsHtml = taskMetaSettings.getContent();



    // create task options as well as the task setting menu

    const $taskOptionsContainer = $('<div class="eam-task-options"></div>');



    const $taskSettingsLink = $(`<a href="#" class="eam-task-option eam-task-settings">${__('Settings', 'aotfw-domain')}</a>`);

    $taskSettingsLink.on('click', function() {

      const $this = $(this);

      $this.parent().siblings('.eam-task-meta-settings-container').first().css('display', '');

      return false;

    });



    const $removeTaskLink = $(`<a href="#" class="eam-task-option eam-remove-task">${__('Remove', 'aotfw-domain')}</a>`);

    $removeTaskLink.on('click', function() {

      const $this = $(this);

      const $parent = $this.parents('.eam-task').first();

      const $acc = $parent.prev();



      $parent.remove();

      $acc.remove();



      // show placeholder if there are no order tasks.

      const $orderTaskContainer = $('#order-tasks-container');

      if (!$orderTaskContainer.find('.eam-task').length) {

        $orderTaskContainer.find('.notask-placeholder').show();

      }

      

      data_manager.setDirty();

      return false;

    });



    $taskOptionsContainer.append($taskSettingsLink);

    $taskOptionsContainer.append($removeTaskLink);



    $fieldGroup.append($taskMetaSettingsHtml);

    $fieldGroup.append($taskOptionsContainer);



    return $fieldGroup;

  }







  _createAccordion(title = null) {

    if (!title) {

      title = this._meta.text;

    }



    // hide placeholders

    $('.notask-placeholder').hide();



    const $fieldAccordion = $(`<button class="accordion"><span>${title}</span></button>`);



    const $tasksContainer = this.getTasksContainer();



    $tasksContainer.find('.placeholder').hide();

    $tasksContainer.append($fieldAccordion);



    $fieldAccordion.on('click', function() {

      const $accordion = $(this);



      // close previously active accordion.

      $accordion.siblings('.active').click();



      // set new accordion as active

      $accordion.toggleClass('active');

      

      const $panel = $accordion.next();

      $panel.css('display') === 'block' ? $panel.css('display', 'none') : $panel.css('display', 'block');



    });



    return $fieldAccordion;

  }

}



class SendMailTask extends BaseOrderTask {



  constructor() {

    super('sendmail', 'fa-solid fa-envelope', __('Send Email', 'aotfw-domain'));

  }



  createFields(config = null) {



    const $fieldGroup = this._getFieldGroup(config);



    // generate recipient field

    const emailTags = ['billing email', 'admin email'];

    const recipients = field_generator.getField('recipients', __('Recipients', 'aotfw-domain'), field_generator.FIELD_TYPE.EMAIL, emailTags);



    // generate subject field

    const subjectTags = this.getDefaultTagsForField();

    const subject = field_generator.getField('subject', __('Subject', 'aotfw-domain'), field_generator.FIELD_TYPE.PLAIN, subjectTags);



    // generator quill html field

    const messageTags = this.getDefaultTagsForTextarea();

    const message = field_generator.getField('message', __('Message', 'aotfw-domain'), field_generator.FIELD_TYPE.HTML, messageTags);



    $fieldGroup.append(recipients.container);

    $fieldGroup.append(subject.container);

    $fieldGroup.append(message.container);



    const $accordion = this._createAccordion();

    this.getTasksContainer().append($fieldGroup);



    // run post dom mounts

    recipients.setup();

    subject.setup();

    message.setup();



    // load config

    if (config) {

      recipients.setValue(config.fields.recipients);

      subject.setValue(config.fields.subject);

      message.setValue(config.fields.message);

    }



    return $accordion;

  }

}



class CreatePostTask extends BaseOrderTask {



  constructor() {

    super('createpost', 'fa-solid fa-pen-to-square', __('Create Post', 'aotfw-domain'));

  }



  createFields(config = null) {



    const $fieldGroup = this._getFieldGroup(config);



    // generate subject field

    const subjectTags = this.getDefaultTagsForField();

    const subject = field_generator.getField('subject', __('Subject', 'aotfw-domain'), field_generator.FIELD_TYPE.PLAIN, subjectTags);



    const contentTags = this.getDefaultTagsForTextarea();

    const content = field_generator.getField('content', __('Content', 'aotfw-domain'), field_generator.FIELD_TYPE.HTML, contentTags);



    const categories = field_generator.getField('categories', __('Categories', 'aotfw-domain'), field_generator.FIELD_TYPE.SELECT_MULTIPLE);



    const author = field_generator.getField('author', __('Author', 'aotfw-domain'), field_generator.FIELD_TYPE.SELECT, null, '* The "Customer of order" option only functions when the customer is not a guest.');



    $fieldGroup.append(subject.container);

    $fieldGroup.append(content.container);

    $fieldGroup.append(categories.container);

    $fieldGroup.append(author.container);



    const $accordion = this._createAccordion();



    this.getTasksContainer().append($fieldGroup);



    // run post dom mounts

    subject.setup();

    content.setup();

    categories.setup();

    author.setup();



    // load config

    if (config) {

      subject.setValue(config.fields.subject);

      content.setValue(config.fields.content);

    }



    // load categories async from WP

    ajax_api.getPostCategories().then((data) => {

      let options = '';

      for (let category of data) {

        options += `<option value="${category.cat_ID}">${category.cat_name}</option>`

      }

      const $select = categories.container.find('select');

      $select.append(options);



      if (config) {

        categories.setValue(config.fields.categories);

      }

    });



    // load users async from WP

    ajax_api.getUsers().then((data) => {

      let options = `<option value="{{customer}}">${__('{{ Customer of order }} *')}</option>`;

      for (let user of data) {

        options += `<option value="${user.ID}">${user.display_name}</option>`;

      }

      const $select = author.container.find('select');

      $select.append(options);



      if (config) {

        author.setValue(config.fields.author);

      }

      

    });

    return $accordion;

  }

}



class LogToFileTask extends BaseOrderTask {



  constructor() {

    super('logtofile', 'fa-solid fa-file-lines', __('Log To File', 'aotfw-domain'));

  }



  createFields(config = null) {



    const $fieldGroup = this._getFieldGroup(config);



    // generate content textarea

    const contentTags = this.getDefaultTagsForTextarea().filter( i => i !== 'order details' ); // remove order details, as it is html - not suitable for logging in a file

    

    const content = field_generator.getField('content', __('Content', 'aotfw-domain'), field_generator.FIELD_TYPE.TEXTAREA, contentTags);



    $fieldGroup.append(content.container);



    const $accordion = this._createAccordion();

    this.getTasksContainer().append($fieldGroup);



    // run post dom mounts

    content.setup();



    // load config

    if (config) {

      content.setValue(config.fields.content);

    }



    return $accordion;

  }

}



class CustomOrderFieldTask extends BaseOrderTask {



  constructor() {

    super('customorderfield', 'fa-solid fa-dice-d6', __('Custom Order Field', 'aotfw-domain'));

  }



  createFields(config = null) {



    const $fieldGroup = this._getFieldGroup(config);



    // generate name field

    const nameTags = this.getDefaultTagsForField().filter( i => i !== 'order details' ); // remove order details, as it is html - not suitable for the order field

    const name = field_generator.getField('name', __('Name', 'aotfw-domain'), field_generator.FIELD_TYPE.PLAIN, nameTags);



    // generate value textarea

    const valueTags = this.getDefaultTagsForTextarea();

    const value = field_generator.getField('value', __('Value', 'aotfw-domain'), field_generator.FIELD_TYPE.TEXTAREA, valueTags);



    $fieldGroup.append(name.container);

    $fieldGroup.append(value.container);



    const $accordion = this._createAccordion();

    this.getTasksContainer().append($fieldGroup);



    // run post dom mounts

    name.setup();

    value.setup();



    // load config

    if (config) {

      name.setValue(config.fields.name);

      value.setValue(config.fields.value);

    }



    return $accordion;

  }

}



class ChangeShippingTask extends BaseOrderTask {



  constructor() {

    super('changeshipping', 'fa-solid fa-truck-fast', __('Change Ship. Method', 'aotfw-domain'));

  }



  createFields(config = null) {



    const $fieldGroup = this._getFieldGroup(config);



    // generate new shipping name field

    const newShippingNameTags = this.getDefaultTagsForField();

    const newShippingName = field_generator.getField('new_shipping_name', __('New Shipping Title (optional)', 'aotfw-domain'), field_generator.FIELD_TYPE.PLAIN, newShippingNameTags);



    // generate new shipping method dropdown

    const newShippingMethod = field_generator.getField('new_shipping_method', __('New Shipping Method', 'aotfw-domain'), field_generator.FIELD_TYPE.SELECT);



    $fieldGroup.append(newShippingName.container);

    $fieldGroup.append(newShippingMethod.container);



    const $accordion = this._createAccordion();

    this.getTasksContainer().append($fieldGroup);



    // run post dom mounts

    newShippingName.setup();

    newShippingMethod.setup();



    // load config

    if (config) {

      newShippingName.setValue(config.fields.new_shipping_name);

    }



    // load shipping methods async from WP

    ajax_api.getShippingMethods().then((data) => {

      let options = '';

      for (let shippingMethod of data) {

        options += `<option value="${shippingMethod.id}">${shippingMethod.method_title}</option>`

      }

      const $select = newShippingMethod.container.find('select');

      $select.append(options);



      if (config) {

        newShippingMethod.setValue(config.fields.new_shipping_method);

      }



    });



    return $accordion;

  }

}



class SendWebhookTask extends BaseOrderTask {



  constructor() {

    super('sendwebhook', 'fa-solid fa-satellite-dish', __('Send Webhook', 'aotfw-domain'));

  }



  createFields(config = null) {



    const $fieldGroup = this._getFieldGroup(config);



    // generate delivery url field

    const deliveryUrl = field_generator.getField('delivery_url', __('Delivery URL', 'aotfw-domain'), field_generator.FIELD_TYPE.PLAIN );



    // generate secret field

    const secret = field_generator.getField('secret', __('Secret Key', 'aotfw-domain'), field_generator.FIELD_TYPE.PLAIN );



    $fieldGroup.append(deliveryUrl.container);

    $fieldGroup.append(secret.container);



    const $accordion = this._createAccordion();

    this.getTasksContainer().append($fieldGroup);



    // run post dom mounts

    deliveryUrl.setup();

    secret.setup();



    // load config

    if (config) {

      deliveryUrl.setValue(config.fields.delivery_url);

      secret.setValue(config.fields.secret);

    }



    return $accordion;

  }

}



class TrashOrderTask extends BaseOrderTask {



  constructor() {

    super('trashorder', 'fa-solid fa-trash', __('Trash Order', 'aotfw-domain'));

  }



  createFields(config = null) {



    const $fieldGroup = this._getFieldGroup(config);



    // generate reason message field

    const reason = field_generator.getField('reason', __('Reason (optional)', 'aotfw-domain'), field_generator.FIELD_TYPE.PLAIN );



    $fieldGroup.append(reason.container);



    const $accordion = this._createAccordion();

    this.getTasksContainer().append($fieldGroup);



    // run post dom mounts

    reason.setup();



    // load config

    if (config) {

      reason.setValue(config.fields.reason);

    }



    return $accordion;

  }

}



const orderTaskFactory = (() => {

  const tasks = {

    'sendmail': SendMailTask,

    'createpost': CreatePostTask,

    'logtofile': LogToFileTask,

    'customorderfield': CustomOrderFieldTask,

    'changeshipping': ChangeShippingTask,

    'sendwebhook': SendWebhookTask,

    'trashorder': TrashOrderTask

  }



  return {

    get: (taskId) => {

      const orderTask = tasks[taskId];

      

      if ( !orderTask ) {

        throw new Error(`Task with ID: ${taskId} not found in orderTaskFactory`);

      }

      return new orderTask();

    }

  }

})();



;// CONCATENATED MODULE: ./_src/automatic-order-tasks/message-manager.js

const messageManager = ($) => {



  const successColor = '#57ab57';

  const errorColor = '#e75d5d';



  const secondsOnScreen = 5;

  

  let msgTimeout;



  return {



    displayMessage: (message, success = true) => {

      const $msgBox = $('#aotfw-msg-box');



      $msgBox.text(message);

      $msgBox.css('background-color', success ? successColor : errorColor);

      $msgBox.css('opacity', 1);



      clearTimeout(msgTimeout);

      msgTimeout = setTimeout(() => {

        $msgBox.css('opacity', 0);

      }, secondsOnScreen*1000);

    }



  }

}





const message_manager_instance = messageManager(jQuery);

/* harmony default export */ const message_manager = (message_manager_instance);

;// CONCATENATED MODULE: ./_src/automatic-order-tasks/automatic-order-tasks.js











jQuery( $ => {

  const { __ } = wp.i18n;



  const taskList = [

    new SendMailTask(),

    new CreatePostTask(),

    new ChangeShippingTask(),

    new LogToFileTask(),

    new CustomOrderFieldTask(),

    new SendWebhookTask(),

    new TrashOrderTask()

  ]



  const $orderSelect = $('#eam-order-stage');



  const onNewTask = () => {

    const onTaskSelect = (task) => {

      const $newAccordion = task.createFields();



      $newAccordion.click();

      data_manager.setDirty();

    }

    automatic_order_tasks_components.createNewTaskWindow(taskList, onTaskSelect);

  }





  const onSaveChanges = function() {

    const $btn = $(this);

    const orig_text = $btn.text();

    $btn.text(__('Saving...', 'aotfw-domain'));

    $btn.prop('disabled', true);



    data_manager.save()

    .then((data) => {

      message_manager.displayMessage(data.data.message);

    })

    .catch(err => {

      message_manager.displayMessage(err.data.message, false);

    })

    .finally(() => {

      setTimeout(() => {

        $btn.text(orig_text);

        $btn.prop('disabled', false);

      }, 1000);



    });

  }



  const onViewLog = function() {

    const $url = $(this).attr('href');



    const err_msg = __('No log found. New entries can be written using the "Log To File" task', 'aotfw-domain');



    if ( !$url.length ) {

      message_manager.displayMessage(err_msg, false);

      return false;

    }

    

    $.ajax({

      url: $url,

      type: 'HEAD',

      success: function() {

        window.open($url, '_blank');

      },

      error: function() {

        message_manager.displayMessage(err_msg, false);

      }

    })



    return false;

  }



  const onOrderStatusClicked = function() {

    $(this).data('last-selected', $(this).find('option:selected'));

  }



  const onOrderStatusChanged = function() {

    const $this = $(this);



    if (data_manager.isDirty()) {

      if (!confirm(__('Unsaved data will be lost. Proceed?', 'aotfw-domain'))) {

        $this.data('last-selected').prop('selected', true);

        return;

      }

    }

    const comps = automatic_order_tasks_components.createBaseComponents($orderSelect);



    comps.newTaskBtn.on('click', onNewTask);

    comps.saveChangesBtn.on('click', onSaveChanges);

    comps.viewLogLink.on('click', onViewLog);



    // load new

    data_manager.load();

  }



  $orderSelect.on('click', onOrderStatusClicked)

  $orderSelect.on('change', onOrderStatusChanged);

  onOrderStatusClicked();

  onOrderStatusChanged(); 



} ); 

/******/ })()

;