define(function (require) {
  const $ = require('jquery')
  const monster = require('monster')

  const app = {
    name: 'rating',

    css: [ 'app' ],

    i18n: {
      'en-US': { customCss: false }
    },

    // Defines API requests not included in the SDK
    requests: {
      'rates.fetch': {
        url: 'rates/{rateId}',
        verb: 'GET'
      },
      'rates.list': {
        url: 'rates',
        verb: 'GET'
      },
      'rates.update': {
        url: 'rates/{rateId}',
        verb: 'PATCH'
      },
      'rates.start': {
        url: 'tasks/{taskId}',
        verb: 'PATCH'
      },
      'rates.check': {
        url: 'tasks/{taskId}',
        verb: 'GET'
      }
    },

    // Define the events available for other apps
    subscribe: {},

    // Method used by the Monster-UI Framework, shouldn't be touched unless you're doing some advanced kind of stuff!
    load: function (callback) {
      const self = this

      self.initApp(function () {
        callback && callback(self)
      })
    },

    // Method used by the Monster-UI Framework, shouldn't be touched unless you're doing some advanced kind of stuff!
    initApp: function (callback) {
      const self = this

      // Used to init the auth token and account id of this app
      monster.pub('auth.initApp', {
        app: self,
        callback: callback
      })
    },

    // Entry Point of the app
    render: function (container) {
      const self = this

      monster.ui.generateAppLayout(self, {
        menus: [
          {
            tabs: [
              {
                callback: self.renderApp
              }
            ]
          }
        ]
      })
    },

    renderApp: function (pArgs) {
      const self = this
      const args = pArgs || {}
      const parent = args.container || $('#rating_app_container .app-content-wrapper')
      const template = $(self.getTemplate({
        name: 'layout',
        data: {
          user: monster.apps.auth.currentUser
        }
      }))

      parent
        .fadeOut(function () {
          $(this)
            .empty()
            .append(template)
            .fadeIn(function () {
              self.updateList(template, () => {
                self.bindEvents(template)
                self.registerPartials()
              })
            })
        })
    },

    updateList: function (template, cb) {
      const self = this

      self.listRates(ratesList => {
        const results = monster.template(self, 'rates', { ratesList: ratesList })

        template
          .find('.rates')
          .empty()
          .append(results)

        cb && cb()
      })
    },

    bindEvents: function (template) {
      const self = this

      template.find('#new-rate').on('click', function (e) {
        const dialogTemplate = $(self.getTemplate({
          name: 'dialog-rate',
          data: {
          }
        }))

        monster.ui.dialog(dialogTemplate, {
          title: self.i18n.active().rate.newRate,
          width: '540px',
          buttons: [{
            text: 'Cancel',
            click: function () {
              $(this).dialog('close')
            }
          }, {
            text: self.i18n.active().rate.save,
            icon: 'ui-icon-heart',
            click: function () {
              self.addRate(self.formToRate(monster.ui.getFormData('rate-form')), function () {
                self.updateList(template)
              })
              $(this).dialog('close', true)
            }
          }]
        })
      })

      template.find('#import-rates').on('click', function (e) {
        e.preventDefault()

        self.importRates($('[name=csv]')[0].files[0], req => {
          const taskId = JSON.parse(req.response).data._read_only.id

          self.startImport(taskId, () => {
            const timer = setInterval(() => {
              self.checkImport(taskId, () => {
                clearInterval(timer)
                self.updateList(template)
              })
            }, 1000)
          })
        })
      })

      template.find('#export-rates').on('click', function (e) {
        e.preventDefault()

        self.exportRates(req => {
          const taskId = JSON.parse(req.response).data._read_only.id

          self.startImport(taskId, () => {
            const timer = setInterval(() => {
              self.checkImport(taskId, data => {
                clearInterval(timer)
              })
            }, 1000)
          })
        })
      })

      template.find('#delete-rates').on('click', function (e) {
        e.preventDefault()

        monster.ui.confirm(self.i18n.active().rate.deleteRateConfirmation, function () {
          self.deleteRates($('[name=csv]')[0].files[0], req => {
            const taskId = JSON.parse(req.response).data._read_only.id

            self.startImport(taskId, () => {
              const timer = setInterval(() => {
                self.checkImport(taskId, () => {
                  clearInterval(timer)
                  self.updateList(template)
                })
              }, 1000)
            })
          })
        })
      })

      template.on('click', '.edit-rate', function (e) {
        self.getRate($(e.target).attr('data-id'), function (rate) {
          const dialogTemplate = $(self.getTemplate({
            name: 'dialog-rate',
            data: {
              rate: self.rateToForm(rate)
            }
          }))

          monster.ui.dialog(dialogTemplate, {
            title: self.i18n.active().rate.updateRate,
            width: '540px',
            buttons: [{
              text: self.i18n.active().rate.cancel,
              click: function () {
                $(this).dialog('close')
              }
            }, {
              text: self.i18n.active().rate.save,
              icon: 'ui-icon-heart',
              click: function () {
                self.updateRate(self.formToRate(monster.ui.getFormData('edit-rate-form')), function () {
                  self.updateList(template)
                })
                $(this).dialog('close', true)
              }
            }]
          })
        })
      })
    },

    registerPartials: function () {
      window.Handlebars.registerHelper({
        referenceProp: function (obj, key) {
          return !obj || ~obj.indexOf(key)
        }
      })
    },

    getRate: function (id, callback) {
      const self = this

      monster.request({
        resource: 'rates.fetch',
        data: {
          rateId: id
        },
        error: self.errorHandler,
        success: function (rate) {
          callback && callback(rate.data)
        }
      })
    },

    listRates: function (cb) {
      const self = this

      monster.request({
        resource: 'rates.list',
        error: self.errorHandler,
        success: ratesList => {
          cb(ratesList.data)
        }
      })
    },

    importRates: function (file, cb) {
      const self = this

      self.uploadPut(`${self.apiUrl}tasks?category=rates&action=import`, file, cb)
    },

    exportRates: function (cb) {
      const self = this

      self.uploadPut(`${self.apiUrl}tasks?category=rates&action=export`, null, cb)
    },

    deleteRates: function (file, cb) {
      const self = this

      self.uploadPut(`${self.apiUrl}tasks?category=rates&action=delete`, file, cb)
    },

    startImport: function (id, cb) {
      monster.request({
        resource: 'rates.start',
        data: {
          taskId: id
        },
        error: self.errorHandler,
        success: cb
      })
    },

    checkImport: function (id, cb) {
      monster.request({
        resource: 'rates.check',
        data: {
          taskId: id
        },
        error: self.errorHandler,
        success: function (data) {
          data.status !== 'executing' && cb(data)
        }
      })
    },

    updateRate: function (data, callback) {
      const self = this

      monster.request({
        resource: 'rates.update',
        data: {
          rateId: data._id,
          data: data
        },
        error: self.errorHandler,
        success: function () {
          callback && callback()
        }
      })
    },

    formToRate: function (form) {
      return Object.assign(form, {
        rate_cost: Number(form.rate_cost),
        direction: form.direction || []
      })
    },

    rateToForm: function (rate) {
      return Object.assign(rate, {
      })
    },

    uploadPut: function (url, file, cb) {
      const self = this

      var req = new XMLHttpRequest()
      req.open('PUT', url)
      if (file) {
        req.setRequestHeader('Content-type', 'text/csv')
      }
      req.setRequestHeader('X-Auth-Token', monster.util.getAuthToken())
      req.onload = cb.bind(null, req)
      req.onerror = self.alertHandler

      req.send(file)
    },

    errorHandler: function (err) {
      console.error('Error occured:', err)
    },

    alertHandler: function (err) {
      this.errorHandler(err)
      monster.ui.alert(`Error occurred. ${err}`)
    }
  }

  return app
})
