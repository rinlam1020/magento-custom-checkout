/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

define([
    'ko',
    'Magento_Checkout/js/model/quote',
    'Magento_Checkout/js/model/resource-url-manager',
    'mage/storage',
    'Magento_Checkout/js/model/payment-service',
    'Magento_Checkout/js/model/payment/method-converter',
    'Magento_Checkout/js/model/error-processor',
    'Magento_Checkout/js/model/full-screen-loader',
    'Magento_Checkout/js/action/select-billing-address',
    'Magento_Checkout/js/model/shipping-save-processor/payload-extender'
], function (
    ko,
    quote,
    resourceUrlManager,
    storage,
    paymentService,
    methodConverter,
    errorProcessor,
    fullScreenLoader,
    selectBillingAddressAction,
    payloadExtender
) {
    'use strict';

    return {
        /**
         * @return {jQuery.Deferred}
         */
        saveShippingInformation: function () {
            var payload;

            //Get flag if coupon is applied
            var hascoupon = quote.hascoupon;
            if (!quote.billingAddress() && quote.shippingAddress().canUseForBilling()) {
                selectBillingAddressAction(quote.shippingAddress());
            }

            //If case for option shipping rate
            var shipping_method_code, shipping_carrier_code;
            if(hascoupon){
                shipping_method_code = 'flatrate';
                shipping_carrier_code = 'flatrate';
            }
            else{
                shipping_method_code = quote.shippingMethod()['method_code'];
                shipping_carrier_code = quote.shippingMethod()['carrier_code'];
            }

            payload = {
                addressInformation: {
                    'shipping_address': quote.shippingAddress(),
                    'billing_address': quote.billingAddress(),
                    // 'shipping_method_code': quote.shippingMethod()['method_code'],
                    // 'shipping_carrier_code': quote.shippingMethod()['carrier_code']
                    'shipping_method_code': shipping_method_code,
                    'shipping_carrier_code': shipping_carrier_code
                }
            };

            payloadExtender(payload);

            fullScreenLoader.startLoader();

            return storage.post(
                resourceUrlManager.getUrlForSetShippingInformation(quote),
                JSON.stringify(payload)
            ).done(
                function (response) {
                    quote.setTotals(response.totals);
                    paymentService.setPaymentMethods(methodConverter(response['payment_methods']));
                    fullScreenLoader.stopLoader();
                }
            ).fail(
                function (response) {
                    errorProcessor.process(response);
                    fullScreenLoader.stopLoader();
                }
            );
        }
    };
});
