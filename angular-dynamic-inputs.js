/**
 * DynamicInputs - Build Inputs in AngularJS From Nothing But JSON
 * @version v0.0.1 - 2017-10-16
 * @link http://github.com/alihasanimam/angular-dynamic-inputs
 * @license MIT, http://opensource.org/licenses/MIT
 */

/**
 * Dynamically build an HTML input using a JSON object as a template.
 *
 * @todo Properly describe this directive.
 * @param {mixed} [template] - The input template itself, as a object.
 * @param {string} [templateUrl] - The URL to retrieve the input template from; template overrides.
 * @param {Object} model - An object in the current scope where the input data should be stored.
 * @example <dynamic-input template-url="input-template.js" ng-model="inputData"></dynamic-input>
 * @example <dynamic-input template="inputTemplate" ng-model="inputData"></dynamic-input>
 */
angular.module('dynInput', [])
    .directive('dynamicInput', ['$q', '$parse', '$http', '$templateCache', '$compile', '$document', '$timeout', function ($q, $parse, $http, $templateCache, $compile, $document, $timeout) {
        var supported = {
            //  Text-based elements
            'text': {element: 'input', type: 'text', editable: true, textBased: true},
            'date': {element: 'input', type: 'date', editable: true, textBased: true},
            'datetime': {element: 'input', type: 'datetime', editable: true, textBased: true},
            'datetime-local': {element: 'input', type: 'datetime-local', editable: true, textBased: true},
            'email': {element: 'input', type: 'email', editable: true, textBased: true},
            'month': {element: 'input', type: 'month', editable: true, textBased: true},
            'number': {element: 'input', type: 'number', editable: true, textBased: true},
            'password': {element: 'input', type: 'password', editable: true, textBased: true},
            'search': {element: 'input', type: 'search', editable: true, textBased: true},
            'tel': {element: 'input', type: 'tel', editable: true, textBased: true},
            'textarea': {element: 'textarea', editable: true, textBased: true},
            'time': {element: 'input', type: 'time', editable: true, textBased: true},
            'url': {element: 'input', type: 'url', editable: true, textBased: true},
            'week': {element: 'input', type: 'week', editable: true, textBased: true},
            //  Specialized editables
            'checkbox': {element: 'input', type: 'checkbox', editable: true, textBased: false},
            'color': {element: 'input', type: 'color', editable: true, textBased: false},
            'file': {element: 'input', type: 'file', editable: true, textBased: false},
            'range': {element: 'input', type: 'range', editable: true, textBased: false},
            'select': {element: 'select', editable: true, textBased: false},
            //  Pseudo-non-editables (containers)
            'checklist': {element: 'div', editable: false, textBased: false},
            'fieldset': {element: 'fieldset', editable: false, textBased: false},
            'radio': {element: 'div', editable: false, textBased: false},
            //  Non-editables (mostly buttons)
            'button': {element: 'button', type: 'button', editable: false, textBased: false},
            'hidden': {element: 'input', type: 'hidden', editable: false, textBased: false},
            'image': {element: 'input', type: 'image', editable: false, textBased: false},
            'legend': {element: 'legend', editable: false, textBased: false},
            'reset': {element: 'button', type: 'reset', editable: false, textBased: false},
            'submit': {element: 'button', type: 'submit', editable: false, textBased: false}
        };

        return {
            restrict: 'E', // supports using directive as element only
            link: function ($scope, element, attrs) {
                //  Check that the required attributes are in place
                if (angular.isDefined(attrs.model) && (angular.isDefined(attrs.template) || angular.isDefined(attrs.templateUrl))) {
                    var newElement = null,
                        model = attrs.model,
                        optGroups = {};
                    //  Grab the template. either from the template attribute, or from the URL in templateUrl
                    (attrs.template ? $q.when($parse(attrs.template)($scope)) :
                            $http.get(attrs.templateUrl, {cache: $templateCache}).then(function (result) {
                                return result.data;
                            })
                    ).then(function (template) {
                        var buildFields = function (field, id) {
                            if (String(id).charAt(0) == '$') {
                                // Don't process keys added by Angular...  See GitHub Issue #29
                                return;
                            }
                            else if (!angular.isDefined(supported[field.type]) || supported[field.type] === false) {
                                //  Unsupported.  Create SPAN with field.label as contents
                                newElement = angular.element('<span></span>');
                                if (angular.isDefined(field.label)) {
                                    angular.element(newElement).html(field.label);
                                }
                                angular.forEach(field, function (val, attr) {
                                    if (["label", "type"].indexOf(attr) > -1) {
                                        return;
                                    }
                                    newElement.attr(attr, val);
                                });
                                element.append(newElement);
                                //newElement = null;
                            }
                            else {
                                //  Supported.  Create element (or container) according to type
                                newElement = angular.element($document[0].createElement(supported[field.type].element));
                                if (angular.isDefined(supported[field.type].type)) {
                                    newElement.attr('type', supported[field.type].type);
                                }

                                //  Editable fields (those that can feed models)
                                if (angular.isDefined(supported[field.type].editable) && supported[field.type].editable) {
                                    if (!angular.isDefined(field.model)){
                                        field.model = model;
                                    }
                                    newElement.attr('name', field.model);
                                    newElement.attr('ng-model', field.model);

                                    if (angular.isDefined(field.readonly)) {
                                        newElement.attr('ng-readonly', field.readonly);
                                    }
                                    if (angular.isDefined(field.required)) {
                                        newElement.attr('ng-required', field.required);
                                    }
                                    if (angular.isDefined(field.val)) {
                                        newElement.attr('value', field.val);
                                    }
                                }

                                //  Fields based on input type=text
                                if (angular.isDefined(supported[field.type].textBased) && supported[field.type].textBased) {
                                    if (angular.isDefined(field.minLength)) {
                                        newElement.attr('ng-minlength', field.minLength);
                                    }
                                    if (angular.isDefined(field.maxLength)) {
                                        newElement.attr('ng-maxlength', field.maxLength);
                                    }
                                    if (angular.isDefined(field.validate)) {
                                        newElement.attr('ng-pattern', field.validate);
                                    }
                                    if (angular.isDefined(field.placeholder)) {
                                        newElement.attr('placeholder', field.placeholder);
                                    }
                                }

                                //  Special cases
                                if (field.type === 'number' || field.type === 'range') {
                                    if (angular.isDefined(field.minValue)) {
                                        newElement.attr('min', field.minValue);
                                    }
                                    if (angular.isDefined(field.maxValue)) {
                                        newElement.attr('max', field.maxValue);
                                    }
                                    if (angular.isDefined(field.step)) {
                                        newElement.attr('step', field.step);
                                    }
                                }
                                else if (['text', 'textarea'].indexOf(field.type) > -1) {
                                    if (angular.isDefined(field.splitBy)) {
                                        newElement.attr('ng-list', field.splitBy);
                                    }
                                }
                                else if (field.type === 'checkbox') {
                                    if (angular.isDefined(field.isOn)) {
                                        newElement.attr('ng-true-value', "'" + field.isOn + "'");
                                    }
                                    if (angular.isDefined(field.isOff)) {
                                        newElement.attr('ng-false-value', "'" + field.isOff + "'");
                                    }
                                    if (angular.isDefined(field.slaveTo)) {
                                        newElement.attr('ng-checked', field.slaveTo);
                                    }
                                }
                                else if (field.type === 'checklist') {
                                    if (angular.isDefined(field.val)) {
                                    }
                                    if (angular.isDefined(field.options)) {
                                        if (!(angular.isDefined(model[field.model]) && angular.isObject(model[field.model]))) {
                                        }
                                        angular.forEach(field.options, function (option, childId) {
                                            newChild = angular.element('<input type="checkbox" />');
                                            newChild.attr('name', field.model + '.' + childId);
                                            newChild.attr('ng-model', field.model + "." + childId);
                                            if (angular.isDefined(option['class'])) {
                                                newChild.attr('ng-class', option['class']);
                                            }
                                            if (angular.isDefined(field.disabled)) {
                                                newChild.attr('ng-disabled', field.disabled);
                                            }
                                            if (angular.isDefined(field.readonly)) {
                                                newChild.attr('ng-readonly', field.readonly);
                                            }
                                            if (angular.isDefined(field.required)) {
                                                newChild.attr('ng-required', field.required);
                                            }
                                            if (angular.isDefined(field.callback)) {
                                                newChild.attr('ng-change', field.callback);
                                            }
                                            if (angular.isDefined(option.isOn)) {
                                                newChild.attr('ng-true-value', "'" + option.isOn + "'");
                                            }
                                            if (angular.isDefined(option.isOff)) {
                                                newChild.attr('ng-false-value', "'" + option.isOff + "'");
                                            }
                                            if (angular.isDefined(option.slaveTo)) {
                                                newChild.attr('ng-checked', option.slaveTo);
                                            }
                                            if (angular.isDefined(option.val)) {
                                                newChild.attr('value', option.val);
                                            }

                                            if (angular.isDefined(option.label)) {
                                                newChild = newChild.wrap('<label></label>').parent();
                                                newChild.append(document.createTextNode(' ' + option.label));
                                            }
                                            newElement.append(newChild);
                                        });
                                    }
                                }
                                else if (field.type === 'radio') {
                                    if (angular.isDefined(field.val)) {
                                    }
                                    if (angular.isDefined(field.values)) {
                                        angular.forEach(field.values, function (label, val) {
                                            newChild = angular.element('<input type="radio" />');
                                            newChild.attr('name', field.model);
                                            newChild.attr('ng-model', field.model);
                                            if (angular.isDefined(field['class'])) {
                                                newChild.attr('ng-class', field['class']);
                                            }
                                            if (angular.isDefined(field.disabled)) {
                                                newChild.attr('ng-disabled', field.disabled);
                                            }
                                            if (angular.isDefined(field.callback)) {
                                                newChild.attr('ng-change', field.callback);
                                            }
                                            if (angular.isDefined(field.readonly)) {
                                                newChild.attr('ng-readonly', field.readonly);
                                            }
                                            if (angular.isDefined(field.required)) {
                                                newChild.attr('ng-required', field.required);
                                            }
                                            newChild.attr('value', val);
                                            if (angular.isDefined(field.val) && field.val === val) {
                                                newChild.attr('checked', 'checked');
                                            }

                                            if (label) {
                                                newChild = newChild.wrap('<label></label>').parent();
                                                newChild.append(document.createTextNode(' ' + label));
                                            }
                                            newElement.append(newChild);
                                        });
                                    }
                                }
                                else if (field.type === 'select') {
                                    if (angular.isDefined(field.multiple) && field.multiple !== false) {
                                        newElement.attr('multiple', 'multiple');
                                    }
                                    if (angular.isDefined(field.empty) && field.empty !== false) {
                                        newElement.append(angular.element($document[0].createElement('option')).attr('value', '').html(field.empty));
                                    }

                                    if (angular.isDefined(field.autoOptions)) {
                                        newElement.attr('ng-options', field.autoOptions);
                                    }
                                    else if (angular.isDefined(field.options)) {
                                        angular.forEach(field.options, function (option, childId) {
                                            newChild = angular.element($document[0].createElement('option'));
                                            newChild.attr('value', childId);
                                            if (angular.isDefined(option.disabled)) {
                                                newChild.attr('ng-disabled', option.disabled);
                                            }
                                            if (angular.isDefined(option.slaveTo)) {
                                                newChild.attr('ng-selected', option.slaveTo);
                                            }
                                            if (angular.isDefined(option.label)) {
                                                newChild.html(option.label);
                                            }
                                            if (angular.isDefined(option.group)) {
                                                if (!angular.isDefined(optGroups[option.group])) {
                                                    optGroups[option.group] = angular.element($document[0].createElement('optgroup'));
                                                    optGroups[option.group].attr('label', option.group);
                                                }
                                                optGroups[option.group].append(newChild);
                                            }
                                            else {
                                                newElement.append(newChild);
                                            }
                                        });

                                        if (!angular.equals(optGroups, {})) {
                                            angular.forEach(optGroups, function (optGroup) {
                                                newElement.append(optGroup);
                                            });
                                            optGroups = {};
                                        }
                                    }
                                }
                                else if (field.type === 'image') {
                                    if (angular.isDefined(field.label)) {
                                        newElement.attr('alt', field.label);
                                    }
                                    if (angular.isDefined(field.source)) {
                                        newElement.attr('src', field.source);
                                    }
                                }
                                else if (field.type === 'hidden') {
                                    newElement.attr('name', field.model);
                                    newElement.attr('ng-model', field.model);
                                    if (angular.isDefined(field.val)) {
                                        newElement.attr('value', field.val);
                                    }
                                }
                                else if (field.type === 'file') {
                                    if (angular.isDefined(field.multiple)) {
                                        newElement.attr('multiple', field.multiple);
                                    }
                                }
                                else if (field.type === 'fieldset') {
                                    if (angular.isDefined(field.fields)) {
                                        var workingElement = newElement;
                                        angular.forEach(field.fields, buildFields, newElement);
                                        newElement = workingElement;
                                    }
                                }
                                else if (field.type === 'date') {
                                    field.type = 'text';
                                    newElement.attr('type', 'text');
                                    $(newElement).datepicker({dateFormat: 'M d yy'});
                                }
                                else if (field.type === 'datetime') {
                                    field.type = 'text';
                                    newElement.attr('type', 'text');
                                    $(newElement).datetimepicker({dateFormat: 'M d yy'});
                                }
                                else if (field.type === 'time') {
                                    field.type = 'text';
                                    newElement.attr('type', 'text');
                                    $(newElement).timepicker({dateFormat: 'M d yy'});
                                }

                                //calx support XRD:CUSTOM
                                if (angular.isDefined(field.cell)) {
                                    newElement.attr('data-cell', field.cell);
                                }
                                if (angular.isDefined(field.formula)) {
                                    newElement.attr('data-formula', field.formula);
                                }
                                if (angular.isDefined(field.format)) {
                                    newElement.attr('data-format', field.format);
                                }

                                //  Common attributes; radio already applied these...
                                if (field.type !== "radio") {
                                    if (angular.isDefined(field['class'])) {
                                        newElement.attr('ng-class', field['class']);
                                    }
                                    //  ...and checklist has already applied these.
                                    if (field.type !== "checklist") {
                                        if (angular.isDefined(field.disabled)) {
                                            newElement.attr('ng-disabled', field.disabled);
                                        }
                                        if (angular.isDefined(field.callback)) {
                                            //  Some input types need listeners on click...
                                            if (["button", "fieldset", "image", "legend", "reset", "submit"].indexOf(field.type) > -1) {
                                                cbAtt = 'ng-click';
                                            }
                                            //  ...the rest on change.
                                            else {
                                                cbAtt = 'ng-change';
                                            }
                                            newElement.attr(cbAtt, field.callback);
                                        }

                                        if (angular.isDefined(field.blur)) { // XRD: CUSTOM
                                            if (["button", "fieldset", "image", "legend", "reset", "submit"].indexOf(field.type) == -1) { // XRD: CUSTOM
                                                newElement.attr('ng-blur', field.blur); // XRD: CUSTOM
                                            }
                                        }

                                        if (angular.isDefined(field.focus)) { // XRD: CUSTOM
                                            if (["button", "fieldset", "image", "legend", "reset", "submit"].indexOf(field.type) == -1) { // XRD: CUSTOM
                                                newElement.attr('ng-focus', field.focus); // XRD: CUSTOM
                                            }
                                        }
                                    }
                                }

                                //  If there's a label, add it.
                                if (angular.isDefined(field.label)) {
                                    //  Some elements have already applied their labels.
                                    if (["image", "hidden"].indexOf(field.type) > -1) {
                                        angular.noop();
                                    }
                                    //  Fieldset elements put their labels in legend child elements.
                                    else if (["fieldset"].indexOf(field.type) > -1) {
                                        newElement.prepend(angular.element($document[0].createElement('legend')).html(field.label));
                                    }
                                    //  Button elements get their labels from their contents.
                                    else if (["button", "legend", "reset", "submit"].indexOf(field.type) > -1) {
                                        newElement.html(field.label);
                                    }
                                    //  Everything else should be wrapped in a label tag.
                                    else {
                                        //newElement = newElement.wrap('<label></label>').parent();
                                        //newElement.prepend(document.createTextNode(field.label + ' '));
                                        newElement.addClass('form-control'); // XRD: CUSTOM

                                        //newElement.className += ' form-control'; // XRD: CUSTOM
                                        newElement = newElement.wrap('<div class="form-group"></div>').parent(); // XRD: CUSTOM
                                        var lblElement = document.createElement('label'); // XRD: CUSTOM
                                        lblElement.setAttribute('for', field.name); // XRD: CUSTOM
                                        lblElement.appendChild(document.createTextNode(field.label)); // XRD: CUSTOM
                                        newElement.prepend(lblElement); // XRD: CUSTOM
                                    }
                                }

                                // Arbitrary attributes
                                if (angular.isDefined(field.attributes)) {
                                    angular.forEach(field.attributes, function (val, attr) {
                                        newElement.attr(attr, val);
                                    });
                                }

                                // Add the element to the page
                                element.append(newElement);
                            }
                        };

                        buildFields(template);

                        //  Compile and update DOM
                        $compile(newElement)($scope);
                        //element.replaceWith(newElement);
                    });
                }
            }
        };
    }]);
