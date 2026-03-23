 (function() {
  'use strict';

  var tinyslider = function() {
    var el = document.querySelectorAll('.testimonial-slider');

    if (el.length > 0) {
      var slider = tns({
        container: '.testimonial-slider',
        items: 1,
        axis: "horizontal",
        controlsContainer: "#testimonial-nav",
        swipeAngle: false,
        speed: 700,
        nav: true,
        controls: true,
        autoplay: true,
        autoplayHoverPause: true,
        autoplayTimeout: 3500,
        autoplayButtonOutput: false
      });
    }
  };
  tinyslider();

  var sitePlusMinus = function() {

    var value,
      quantity = document.getElementsByClassName('quantity-container');

    function createBindings(quantityContainer) {
      var quantityAmount = quantityContainer.getElementsByClassName('quantity-amount')[0];
      var increase = quantityContainer.getElementsByClassName('increase')[0];
      var decrease = quantityContainer.getElementsByClassName('decrease')[0];
      increase.addEventListener('click', function(e) { increaseValue(e, quantityAmount); });
      decrease.addEventListener('click', function(e) { decreaseValue(e, quantityAmount); });
    }

    function init() {
      for (var i = 0; i < quantity.length; i++) {
        createBindings(quantity[i]);
      }
    }

    function increaseValue(event, quantityAmount) {
      value = parseInt(quantityAmount.value, 10);
      value = isNaN(value) ? 0 : value;
      value++;
      quantityAmount.value = value;
    }

    function decreaseValue(event, quantityAmount) {
      value = parseInt(quantityAmount.value, 10);
      value = isNaN(value) ? 0 : value;
      if (value > 0) value--;
      quantityAmount.value = value;
    }

    init();
  };
  sitePlusMinus();

  // Favorites page: empty state, unfavorite with undo, share/copy.
  // List markup can later be rendered from your API; keep data-product-id on .favorite-item
  // and wrap each row in .favorite-item-col. Optional: call fetch on remove/undo when backend exists.
  var favoritesPage = function() {
    var listRow = document.getElementById('favorites-list-row');
    if (!listRow) return;

    var emptyEl = document.getElementById('favorites-empty-state');
    var toastEl = document.getElementById('favorites-toast');
    var toastMsgEl = document.getElementById('favorites-toast-message');
    var toastUndoEl = document.getElementById('favorites-toast-undo');
    var toastTimer = null;
    var pendingUndoHandler = null;

    function itemCount() {
      return listRow.querySelectorAll('.favorite-item-col .favorite-item').length;
    }

    function updateEmptyState() {
      if (!emptyEl) return;
      var n = itemCount();
      if (n === 0) {
        emptyEl.classList.remove('d-none');
      } else {
        emptyEl.classList.add('d-none');
      }
    }

    function initFavoriteItem(item) {
      if (!item) return;
      var productId = item.getAttribute('data-product-id') || '';
      var url = window.location.origin + window.location.pathname + '?product=' + encodeURIComponent(productId);
      var shareLinkEl = item.querySelector('.favorite-share-link');
      if (shareLinkEl) {
        shareLinkEl.href = url;
        shareLinkEl.textContent = url;
      }
    }

    function hideToast() {
      if (toastTimer) {
        clearTimeout(toastTimer);
        toastTimer = null;
      }
      if (pendingUndoHandler && toastUndoEl) {
        toastUndoEl.removeEventListener('click', pendingUndoHandler);
        pendingUndoHandler = null;
      }
      if (toastEl) toastEl.classList.add('d-none');
    }

    function showUndoToast(message, onUndo) {
      hideToast();
      if (!toastEl || !toastMsgEl || !toastUndoEl) return;
      toastMsgEl.textContent = message;
      toastEl.classList.remove('d-none');

      pendingUndoHandler = function() {
        if (toastUndoEl && pendingUndoHandler) {
          toastUndoEl.removeEventListener('click', pendingUndoHandler);
        }
        pendingUndoHandler = null;
        if (toastTimer) {
          clearTimeout(toastTimer);
          toastTimer = null;
        }
        if (toastEl) toastEl.classList.add('d-none');
        if (onUndo) onUndo();
      };
      toastUndoEl.addEventListener('click', pendingUndoHandler);

      toastTimer = setTimeout(function() {
        hideToast();
      }, 6000);
    }

    listRow.querySelectorAll('.favorite-item').forEach(initFavoriteItem);
    updateEmptyState();

    listRow.addEventListener('click', function(e) {
      var copyBtn = e.target.closest('.favorite-copy-btn');
      if (copyBtn && listRow.contains(copyBtn)) {
        e.preventDefault();
        var item = copyBtn.closest('.favorite-item');
        if (!item) return;
        var productId = item.getAttribute('data-product-id') || '';
        var url = window.location.origin + window.location.pathname + '?product=' + encodeURIComponent(productId);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url);
        } else {
          window.prompt('Copy this link', url);
        }
        return;
      }

      var heart = e.target.closest('.favorite-heart');
      if (!heart || !listRow.contains(heart)) return;
      e.preventDefault();

      var item = heart.closest('.favorite-item');
      var col = heart.closest('.favorite-item-col');
      if (!item || !col) return;

      var productName = item.getAttribute('data-product-name') || 'Item';
      var nextSibling = col.nextSibling;
      var savedHtml = col.outerHTML;

      col.parentNode.removeChild(col);
      updateEmptyState();

      showUndoToast('Removed "' + productName + '" from favorites.', function() {
        var wrap = document.createElement('div');
        wrap.innerHTML = savedHtml;
        var restored = wrap.firstElementChild;
        if (!restored) return;
        if (nextSibling && nextSibling.parentNode === listRow) {
          listRow.insertBefore(restored, nextSibling);
        } else {
          listRow.appendChild(restored);
        }
        var restoredItem = restored.querySelector('.favorite-item');
        initFavoriteItem(restoredItem);
        updateEmptyState();
      });
    });
  };
  favoritesPage();

 })();