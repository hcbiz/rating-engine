define(function (require) {
  const $ = require('jquery')
  const monster = require('monster')
  const utils = require('./utils')
  const c = require('./constants')

  const app = {
    name: 'rating',

    css: [ 'app' ],

    i18n: {
      'en-US': { customCss: false }
    },

    // Defines API requests not included in the SDK
    requests: {
      'rates.list': {
        url: 'rates',
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

      this.listRates(function (ratesList) {
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
        alert('HERE')
      })

      template.on('click', '.edit-rate', function (e) {
        self.getRate($(e.target).attr('data-id'), function (rate) {
          const dialogTemplate = $(self.getTemplate({
            name: 'dialog-rate',
            data: {
              date: self.rateToForm(rate)
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
                self.updateRate(self.formToRate(monster.ui.getFormData('rate-form')), function () {
                  self.updateList(template)
                })
                $(this).dialog('close', true)
              }
            }]
          })
        })
      })

      template.on('click', '.remove-rate', function (e) {
        monster.ui.confirm(self.i18n.active().rate.deleteRateConfirmation, function () {
          self.removeRate($(e.target).attr('data-id'), function () {
            self.updateList(template)
          })
        })
      })
    },

    registerPartials: function () {
    },

    getRate: function (id, callback) {
      const self = this

      this.callApi({
        resource: 'rates.get',
        data: {
          accountId: self.accountId,
          resourceId: id
        },
        error: self.errorHandler,
        success: function (rate) {
          callback && callback(rate.data)
        }
      })
    },

    listRates: function (callback) {
      const self = this

      monster.request({
        resource: 'rates.list',
        data: {
          accountId: self.accountId
        },
        error: self.errorHandler,
        success: function (ratesList) {
          callback && callback(ratesList.data)
        }
      })
    },

    addRate: function (data, callback) {
      const self = this

      this.callApi({
        resource: 'rates.create',
        data: {
          accountId: self.accountId,
          data: data
        },
        error: self.errorHandler,
        success: function () {
          callback && callback()
        }
      })
    },

    updateRate: function (data, callback) {
      const self = this

      this.callApi({
        resource: 'rates.update',
        data: {
          accountId: self.accountId,
          resourceId: data.resourceId,
          data: data
        },
        error: self.errorHandler,
        success: function () {
          callback && callback()
        }
      })
    },

    removeCarrier: function (id, callback) {
      const self = this

      this.callApi({
        resource: 'localResources.delete',
        data: {
          accountId: self.accountId,
          resourceId: id,
          data: {}
        },
        error: self.errorHandler,
        success: function () {
          callback && callback()
        }
      })
    },

    formToRate: function (form) {
      return Object.assign(form, {
      })
    },

    rateToForm: function (rate) {
      return Object.assign(rate, {
      })
    },

<<<<<<< HEAD
=======
    updateArray: function (arr, form) {
      return arr.reduce((acc, el) => {
        if (form[el]) {
          acc.push(el)
        }

        return acc
      }, [])
    },

    transposeArray: function (arr, form, dim) {
      return arr.reduce((acc, el) => {
        return form[el].reduce((acc, val, idx) => {
          if (val) {
            acc[idx].push(el)
          }

          return acc
        }, acc)
      }, new Array(dim).fill(null).map(() => []))
    },

    transformData: function (data) {
      return {
        name: data.name,
        enabled: data.enabled,
        flags: data.flags,
        weight_cost: data.weight_cost || void 0,
        rules: data.rules,
        caller_id_type: data.caller_id_type,
        gateways: utils.zip(
          data.gateways,
          data.gatewaysEnabled,
          data.codecs,
          data.gatewaysRoute,
          data.gatewaysUsername,
          data.gatewaysPassword,
          data.gatewaysPrefix,
          data.gatewaysSuffix,
          data.gatewaysProgressTimeout
        ).map(gateway => ({
          server: gateway[0],
          enabled: gateway[1],
          codecs: gateway[2],
          route: gateway[3],
          username: gateway[4],
          password: gateway[5],
          prefix: gateway[6],
          suffix: gateway[7],
          progress_timeout: gateway[8] || void 0
        }))
      }
    },

>>>>>>> 215ef407ed7953fa63ae542ceef239fbfea9d76e
    errorHandler: function (err) {
      console.error('Error occured:', err)
    }
  }

  return app
})
