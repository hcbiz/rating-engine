define(function (require) {
  return {
    zip: function () {
      return arguments[0].map((el, idx) => {
        const res = [el]

        Array.prototype.slice.call(arguments, 1).map(arg => res.push(arg[idx]))

        return res
      })
    }
  }
})
