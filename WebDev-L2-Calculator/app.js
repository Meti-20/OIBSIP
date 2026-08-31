"use strict";

/*
========================================================
    CALCORA SCIENTIFIC
    Vanilla JavaScript Calculator
========================================================
*/


/* ======================================================
   CALCULATOR STATE
====================================================== */

let currentInput = "";
let previousValue = null;
let currentOperator = null;

let waitingForNumber = false;
let justCalculated = false;

let expressionText = "";

let history =
    JSON.parse(localStorage.getItem("calcoraHistory")) || [];


/* ======================================================
   DOM ELEMENTS
====================================================== */

const expressionEl =
    document.getElementById("expression");

const resultEl =
    document.getElementById("result");

const statusEl =
    document.getElementById("status");

const errorEl =
    document.getElementById("error");

const errorTitleEl =
    document.getElementById("errorTitle");

const errorMessageEl =
    document.getElementById("errorMessage");

const basicBtn =
    document.getElementById("basicBtn");

const scientificBtn =
    document.getElementById("scientificBtn");

const scientificPanel =
    document.getElementById("scientificPanel");

const clearBtn =
    document.getElementById("clearBtn");

const backspaceBtn =
    document.getElementById("backspaceBtn");

const percentBtn =
    document.getElementById("percentBtn");

const equalsBtn =
    document.getElementById("equalsBtn");

const copyBtn =
    document.getElementById("copyBtn");

const themeBtn =
    document.getElementById("themeBtn");

const historyList =
    document.getElementById("historyList");

const clearHistoryBtn =
    document.getElementById("clearHistory");

const mobileScientific =
    document.getElementById("mobileScientific");


/* ======================================================
   BASIC HELPERS
====================================================== */

function formatNumber(value) {

    if (!Number.isFinite(value)) {
        return "Error";
    }

    /*
       Remove tiny floating-point errors.
       Example:
       0.30000000000000004 → 0.3
    */

    if (Math.abs(value) < 1e-12) {
        value = 0;
    }

    return Number(
        value.toPrecision(12)
    ).toString();
}


function updateDisplay() {

    expressionEl.textContent =
        expressionText || "0";

    resultEl.textContent =
        currentInput || "0";
}


function setStatus(message) {

    statusEl.textContent =
        message;
}


/* ======================================================
   ERROR HANDLING
====================================================== */

function hideError() {

    errorEl.classList.remove("show");

    setStatus("Ready");
}


function showError(title, message) {

    errorTitleEl.textContent =
        title;

    errorMessageEl.textContent =
        message;

    errorEl.classList.add("show");

    setStatus("Error");
}


/* ======================================================
   RESET CALCULATOR
====================================================== */

function resetCalculator() {

    currentInput = "";

    previousValue = null;

    currentOperator = null;

    waitingForNumber = false;

    justCalculated = false;

    expressionText = "";

    hideError();

    updateDisplay();
}


/* ======================================================
   NUMBER INPUT
====================================================== */

function inputNumber(value) {

    hideError();


    /*
       If the previous action was "="
       and the user enters a new number,
       start a completely new calculation.

       Example:

       8 + 4 = 12
       press 7

       → 7
    */

    if (justCalculated) {

        currentInput = "";

        expressionText = "";

        previousValue = null;

        currentOperator = null;

        waitingForNumber = false;

        justCalculated = false;
    }


    /*
       If an operator was just pressed,
       this is the second number.

       Example:

       8 −
       press 4

       → start entering 4
    */

    if (waitingForNumber) {

        currentInput = "";

        waitingForNumber = false;
    }


    /*
       Decimal handling.
    */

    if (value === ".") {

        if (currentInput.includes(".")) {
            return;
        }

        if (currentInput === "") {
            currentInput = "0";
        }
    }


    /*
       Prevent:

       0005

       and make it:

       5
    */

    if (
        currentInput === "0" &&
        value !== "."
    ) {

        currentInput = "";
    }


    currentInput += value;


    /*
       Update expression.
    */

    if (
        previousValue !== null &&
        currentOperator !== null
    ) {

        expressionText =
            `${formatNumber(previousValue)} ${currentOperator} ${currentInput}`;

    } else {

        expressionText =
            currentInput;
    }


    updateDisplay();
}


/* ======================================================
   NUMBER BUTTONS
====================================================== */

/*
   IMPORTANT:

   Only buttons with data-key AND without
   the .operator class are number buttons.

   This prevents + − × ÷ from being
   interpreted as numbers.
*/

document
    .querySelectorAll(
        ".keypad button[data-key]:not(.operator)"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                inputNumber(
                    button.dataset.key
                );

            }
        );

    });


/* ======================================================
   OPERATOR INPUT
====================================================== */

document
    .querySelectorAll(
        ".keypad .operator"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                chooseOperator(
                    button.dataset.key
                );

            }
        );

    });


function chooseOperator(newOperator) {

    hideError();


    /*
       If there is no number yet,
       don't allow an operator.

       Example:

       + ❌
    */

    if (
        currentInput === "" &&
        previousValue === null
    ) {

        return;
    }


    /*
       If the user just calculated:

       8 + 4 = 12
       then presses ×

       Continue using 12.

       12 ×
    */

    if (justCalculated) {

        previousValue =
            Number(currentInput);

        currentInput = "";

        justCalculated = false;

        currentOperator =
            newOperator;

        waitingForNumber = true;

        expressionText =
            `${formatNumber(previousValue)} ${newOperator}`;

        resultEl.textContent =
            formatNumber(previousValue);

        setStatus(
            "Enter second number"
        );

        updateDisplay();

        return;
    }


    /*
       If the user presses another operator
       immediately:

       8 +
       then ×

       simply change it to:

       8 ×
    */

    if (
        waitingForNumber &&
        previousValue !== null
    ) {

        currentOperator =
            newOperator;

        expressionText =
            `${formatNumber(previousValue)} ${newOperator}`;

        setStatus(
            "Enter second number"
        );

        updateDisplay();

        return;
    }


    /*
       If we already have:

       8 + 4

       and the user presses ×,

       calculate 8 + 4 first.

       Result = 12

       Then:

       12 ×
    */

    if (
        previousValue !== null &&
        currentOperator !== null &&
        currentInput !== ""
    ) {

        const calculated =
            performCalculation(
                previousValue,
                Number(currentInput),
                currentOperator
            );


        if (calculated === null) {
            return;
        }


        previousValue =
            calculated;

        currentInput = "";

    } else {

        /*
           First operator.

           Example:

           8 −

           Save 8.
        */

        previousValue =
            Number(currentInput);

        currentInput = "";
    }


    currentOperator =
        newOperator;

    waitingForNumber = true;


    /*
       Keep the first number visible.

       Example:

       8 −
    */

    expressionText =
        `${formatNumber(previousValue)} ${currentOperator}`;


    resultEl.textContent =
        formatNumber(previousValue);


    setStatus(
        "Enter second number"
    );


    updateDisplay();
}


/* ======================================================
   CALCULATION ENGINE
====================================================== */

function performCalculation(
    first,
    second,
    operator
) {

    switch (operator) {

        case "+":

            return first + second;


        case "−":

            return first - second;


        case "×":

            return first * second;


        case "÷":

            if (second === 0) {

                showError(
                    "Cannot divide by zero",
                    "Check your expression and try again."
                );

                return null;
            }

            return first / second;


        case "^":

            return Math.pow(
                first,
                second
            );


        default:

            return null;
    }
}


/* ======================================================
   EQUALS
====================================================== */

equalsBtn.addEventListener(
    "click",
    calculateResult
);


function calculateResult() {

    hideError();


    /*
       No calculation to perform.
    */

    if (
        previousValue === null ||
        currentOperator === null
    ) {

        return;
    }


    /*
       Example:

       8 + =

       Don't produce an error.
    */

    if (
        waitingForNumber ||
        currentInput === ""
    ) {

        setStatus(
            "Enter second number"
        );

        return;
    }


    const first =
        previousValue;

    const second =
        Number(currentInput);

    const selectedOperator =
        currentOperator;


    const answer =
        performCalculation(
            first,
            second,
            selectedOperator
        );


    /*
       Division by zero or another error.
    */

    if (answer === null) {
        return;
    }


    const formattedAnswer =
        formatNumber(answer);


    /*
       Save expression.
    */

    expressionText =
        `${formatNumber(first)} ${selectedOperator} ${formatNumber(second)}`;


    /*
       Show answer.
    */

    currentInput =
        formattedAnswer;


    /*
       Reset operation state.
    */

    previousValue = null;

    currentOperator = null;

    waitingForNumber = false;

    justCalculated = true;


    /*
       Save calculation to history.
    */

    addHistory(
        expressionText,
        formattedAnswer
    );


    setStatus(
        "Calculated"
    );


    updateDisplay();
}


/* ======================================================
   CLEAR
====================================================== */

clearBtn.addEventListener(
    "click",
    () => {

        resetCalculator();

        setStatus(
            "Ready"
        );
    }
);


/* ======================================================
   BACKSPACE
====================================================== */

backspaceBtn.addEventListener(
    "click",
    () => {

        hideError();


        /*
           If we are waiting for
           the second number, there
           is nothing to delete yet.
        */

        if (waitingForNumber) {
            return;
        }


        /*
           If calculation was just completed,
           allow backspace on the result.
        */

        if (justCalculated) {

            currentInput =
                currentInput.slice(0, -1);

            expressionText =
                currentInput;

            justCalculated = false;

            updateDisplay();

            return;
        }


        currentInput =
            currentInput.slice(0, -1);


        /*
           Update expression.
        */

        if (
            previousValue !== null &&
            currentOperator !== null
        ) {

            expressionText =
                `${formatNumber(previousValue)} ${currentOperator} ${currentInput}`;

        } else {

            expressionText =
                currentInput;
        }


        updateDisplay();
    }
);


/* ======================================================
   PERCENT
====================================================== */

percentBtn.addEventListener(
    "click",
    () => {

        hideError();


        if (
            currentInput === ""
        ) {

            return;
        }


        const number =
            Number(currentInput);


        currentInput =
            formatNumber(
                number / 100
            );


        /*
           If this is part of an expression,
           keep the first number and operator.
        */

        if (
            previousValue !== null &&
            currentOperator !== null
        ) {

            expressionText =
                `${formatNumber(previousValue)} ${currentOperator} ${currentInput}`;

        } else {

            expressionText =
                currentInput;
        }


        updateDisplay();
    }
);


/* ======================================================
   BASIC MODE
====================================================== */

basicBtn.addEventListener(
    "click",
    () => {

        basicBtn.classList.add(
            "active"
        );

        scientificBtn.classList.remove(
            "active"
        );

        scientificPanel.classList.add(
            "hidden"
        );

        setStatus(
            "Basic mode"
        );
    }
);


/* ======================================================
   SCIENTIFIC MODE
====================================================== */

scientificBtn.addEventListener(
    "click",
    () => {

        scientificBtn.classList.add(
            "active"
        );

        basicBtn.classList.remove(
            "active"
        );

        scientificPanel.classList.remove(
            "hidden"
        );

        setStatus(
            "Scientific mode"
        );
    }
);


/* ======================================================
   SCIENTIFIC BUTTONS
====================================================== */

document
    .querySelectorAll(
        "[data-scientific]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                scientificFunction(
                    button.dataset.scientific
                );

            }
        );

    });


/* ======================================================
   SCIENTIFIC FUNCTION ENGINE
====================================================== */

function scientificFunction(type) {

    hideError();


    /* ----------------------------------------------
       PI
    ---------------------------------------------- */

    if (type === "pi") {

        prepareScientificInput();

        currentInput =
            formatNumber(Math.PI);

        expressionText =
            "π";

        updateDisplay();

        return;
    }


    /* ----------------------------------------------
       E
    ---------------------------------------------- */

    if (type === "e") {

        prepareScientificInput();

        currentInput =
            formatNumber(Math.E);

        expressionText =
            "e";

        updateDisplay();

        return;
    }


    /* ----------------------------------------------
       LEFT PARENTHESIS
    ---------------------------------------------- */

    if (type === "left") {

        prepareScientificInput();

        currentInput += "(";

        expressionText =
            currentInput;

        updateDisplay();

        return;
    }


    /* ----------------------------------------------
       RIGHT PARENTHESIS
    ---------------------------------------------- */

    if (type === "right") {

        if (
            currentInput === ""
        ) {

            return;
        }

        currentInput += ")";

        expressionText =
            currentInput;

        updateDisplay();

        return;
    }


    /* ----------------------------------------------
       SCIENTIFIC FUNCTIONS NEED A NUMBER
    ---------------------------------------------- */

    if (
        currentInput === ""
    ) {

        showError(
            "Empty input",
            "Enter a number first."
        );

        return;
    }


    /* ----------------------------------------------
       POWER xʸ
    ---------------------------------------------- */

    if (type === "power") {

        previousValue =
            Number(currentInput);

        currentInput = "";

        currentOperator =
            "^";

        waitingForNumber = true;

        justCalculated = false;

        expressionText =
            `${formatNumber(previousValue)} ^`;

        resultEl.textContent =
            "0";

        setStatus(
            "Enter exponent"
        );

        updateDisplay();

        return;
    }


    /*
       Convert input to number.

       Parentheses are not evaluated here;
       they are treated as text.
    */

    const number =
        Number(currentInput);


    if (
        !Number.isFinite(number)
    ) {

        showError(
            "Invalid expression",
            "Check your expression and try again."
        );

        return;
    }


    let answer;


    /* ----------------------------------------------
       TRIGONOMETRY
       DEGREE MODE
    ---------------------------------------------- */

    switch (type) {

        case "sin":

            answer =
                Math.sin(
                    number *
                    Math.PI /
                    180
                );

            break;


        case "cos":

            answer =
                Math.cos(
                    number *
                    Math.PI /
                    180
                );

            break;


        case "tan":

            answer =
                Math.tan(
                    number *
                    Math.PI /
                    180
                );

            break;


        /* ------------------------------------------
           INVERSE TRIGONOMETRY
        ------------------------------------------ */

        case "asin":

            if (
                number < -1 ||
                number > 1
            ) {

                showError(
                    "Invalid scientific operation",
                    "sin⁻¹ requires a value between −1 and 1."
                );

                return;
            }

            answer =
                Math.asin(number) *
                180 /
                Math.PI;

            break;


        case "acos":

            if (
                number < -1 ||
                number > 1
            ) {

                showError(
                    "Invalid scientific operation",
                    "cos⁻¹ requires a value between −1 and 1."
                );

                return;
            }

            answer =
                Math.acos(number) *
                180 /
                Math.PI;

            break;


        case "atan":

            answer =
                Math.atan(number) *
                180 /
                Math.PI;

            break;


        /* ------------------------------------------
           SQUARE ROOT
        ------------------------------------------ */

        case "sqrt":

            if (number < 0) {

                showError(
                    "Invalid scientific operation",
                    "Square root cannot use a negative number."
                );

                return;
            }

            answer =
                Math.sqrt(number);

            break;


        /* ------------------------------------------
           SQUARE
        ------------------------------------------ */

        case "square":

            answer =
                number * number;

            break;


        /* ------------------------------------------
           NATURAL LOG
        ------------------------------------------ */

        case "ln":

            if (number <= 0) {

                showError(
                    "Invalid scientific operation",
                    "ln requires a number greater than zero."
                );

                return;
            }

            answer =
                Math.log(number);

            break;


        /* ------------------------------------------
           LOG BASE 10
        ------------------------------------------ */

        case "log":

            if (number <= 0) {

                showError(
                    "Invalid scientific operation",
                    "log requires a number greater than zero."
                );

                return;
            }

            answer =
                Math.log10(number);

            break;


        /* ------------------------------------------
           FACTORIAL
        ------------------------------------------ */

        case "factorial":

            if (
                number < 0 ||
                !Number.isInteger(number)
            ) {

                showError(
                    "Invalid factorial",
                    "Factorial requires a non-negative whole number."
                );

                return;
            }

            answer =
                factorial(number);

            break;


        /* ------------------------------------------
           PERCENT
        ------------------------------------------ */

        case "percent":

            answer =
                number / 100;

            break;


        /* ------------------------------------------
           NEGATIVE / POSITIVE
        ------------------------------------------ */

        case "negative":

            answer =
                -number;

            break;


        default:

            return;
    }


    if (
        !Number.isFinite(answer)
    ) {

        showError(
            "Invalid scientific operation",
            "The calculation produced an invalid result."
        );

        return;
    }


    currentInput =
        formatNumber(answer);


    expressionText =
        `${scientificLabel(type)}(${formatNumber(number)})`;


    waitingForNumber = false;

    justCalculated = false;


    setStatus(
        "Scientific calculation"
    );


    updateDisplay();
}


/* ======================================================
   SCIENTIFIC INPUT PREPARATION
====================================================== */

function prepareScientificInput() {

    /*
       If user just calculated something
       and then presses π, e, etc.,
       start with the new value.
    */

    if (justCalculated) {

        currentInput = "";

        expressionText = "";

        previousValue = null;

        currentOperator = null;

        waitingForNumber = false;

        justCalculated = false;
    }


    /*
       If an operator was waiting,
       start entering the next value.
    */

    if (waitingForNumber) {

        currentInput = "";

        waitingForNumber = false;
    }
}


/* ======================================================
   SCIENTIFIC LABELS
====================================================== */

function scientificLabel(type) {

    const labels = {

        sin: "sin",

        cos: "cos",

        tan: "tan",

        asin: "sin⁻¹",

        acos: "cos⁻¹",

        atan: "tan⁻¹",

        sqrt: "√",

        square: "x²",

        ln: "ln",

        log: "log",

        factorial: "!"

    };


    return labels[type] || type;
}


/* ======================================================
   FACTORIAL
====================================================== */

function factorial(number) {

    /*
       JavaScript numbers become unsafe
       beyond this range.
    */

    if (number > 170) {

        showError(
            "Number too large",
            "This factorial is too large to calculate."
        );

        return NaN;
    }


    let total = 1;


    for (
        let i = 2;
        i <= number;
        i++
    ) {

        total *= i;
    }


    return total;
}


/* ======================================================
   HISTORY
====================================================== */

function addHistory(
    expressionValue,
    resultValue
) {

    history.unshift({

        id:
            Date.now() +
            Math.random(),

        expression:
            expressionValue,

        result:
            resultValue
    });


    /*
       Keep the latest 30 calculations.
    */

    history =
        history.slice(0, 30);


    localStorage.setItem(
        "calcoraHistory",
        JSON.stringify(history)
    );


    renderHistory();
}


function renderHistory() {

    /*
       EMPTY HISTORY
    */

    if (
        history.length === 0
    ) {

        historyList.innerHTML = `

            <div class="empty-history">

                <strong>
                    No calculations yet
                </strong>

                <span>
                    Your calculations
                    will appear here.
                </span>

            </div>

        `;

        return;
    }


    historyList.innerHTML = "";


    history.forEach(item => {

        const historyItem =
            document.createElement("div");


        historyItem.className =
            "history-item";


        historyItem.innerHTML = `

            <div class="history-expression">
                ${escapeHTML(item.expression)}
            </div>

            <div class="history-result">
                ${escapeHTML(item.result)}
            </div>

            <button
                class="delete-history"
                type="button"
                aria-label="Delete calculation"
            >
                ×
            </button>

        `;


        /*
           Clicking a history item
           restores its result.
        */

        historyItem.addEventListener(
            "click",
            event => {

                if (
                    event.target.classList.contains(
                        "delete-history"
                    )
                ) {

                    return;
                }


                currentInput =
                    item.result;

                previousValue = null;

                currentOperator = null;

                waitingForNumber = false;

                justCalculated = true;

                expressionText =
                    item.expression;


                updateDisplay();


                setStatus(
                    "History restored"
                );
            }
        );


        /*
           Delete one history item.
        */

        const deleteButton =
            historyItem.querySelector(
                ".delete-history"
            );


        deleteButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                history =
                    history.filter(
                        historyItem =>
                            historyItem.id !==
                            item.id
                    );


                localStorage.setItem(
                    "calcoraHistory",
                    JSON.stringify(history)
                );


                renderHistory();
            }
        );


        historyList.appendChild(
            historyItem
        );

    });
}


/* ======================================================
   CLEAR ALL HISTORY
====================================================== */

clearHistoryBtn.addEventListener(
    "click",
    () => {

        history = [];

        localStorage.removeItem(
            "calcoraHistory"
        );

        renderHistory();
    }
);


/* ======================================================
   COPY RESULT
====================================================== */

copyBtn.addEventListener(
    "click",
    async () => {

        const value =
            currentInput || "0";


        try {

            await navigator.clipboard.writeText(
                value
            );

            setStatus(
                "Result copied"
            );

        } catch {

            /*
               Fallback for browsers where
               clipboard API is unavailable.
            */

            const temporaryInput =
                document.createElement("input");

            temporaryInput.value =
                value;

            document.body.appendChild(
                temporaryInput
            );

            temporaryInput.select();

            document.execCommand(
                "copy"
            );

            temporaryInput.remove();


            setStatus(
                "Result copied"
            );
        }
    }
);


/* ======================================================
   LIGHT / DARK MODE
====================================================== */

themeBtn.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "light"
        );


        const isLight =
            document.body.classList.contains(
                "light"
            );


        localStorage.setItem(
            "calcoraTheme",
            isLight
                ? "light"
                : "dark"
        );


        themeBtn.textContent =
            isLight
                ? "☀"
                : "☾";
    }
);


/*
   Load saved theme.
*/

if (
    localStorage.getItem(
        "calcoraTheme"
    ) === "light"
) {

    document.body.classList.add(
        "light"
    );

    themeBtn.textContent =
        "☀";
}


/* ======================================================
   MOBILE SCIENTIFIC FUNCTIONS
====================================================== */

if (mobileScientific) {

    mobileScientific.addEventListener(
        "click",
        () => {

            scientificPanel.classList.toggle(
                "mobile-open"
            );


            const isOpen =
                scientificPanel.classList.contains(
                    "mobile-open"
                );


            const indicator =
                mobileScientific.querySelector(
                    "span"
                );


            if (indicator) {

                indicator.textContent =
                    isOpen
                        ? "−"
                        : "+";
            }
        }
    );
}


/* ======================================================
   KEYBOARD SUPPORT
====================================================== */

document.addEventListener(
    "keydown",
    event => {

        const key =
            event.key;


        /*
           Numbers
        */

        if (
            key >= "0" &&
            key <= "9"
        ) {

            inputNumber(key);

            return;
        }


        /*
           Decimal
        */

        if (
            key === "."
        ) {

            inputNumber(".");

            return;
        }


        /*
           Addition
        */

        if (
            key === "+"
        ) {

            chooseOperator("+");

            return;
        }


        /*
           Subtraction
        */

        if (
            key === "-"
        ) {

            chooseOperator("−");

            return;
        }


        /*
           Multiplication
        */

        if (
            key === "*"
        ) {

            chooseOperator("×");

            return;
        }


        /*
           Division
        */

        if (
            key === "/"
        ) {

            event.preventDefault();

            chooseOperator("÷");

            return;
        }


        /*
           Equals
        */

        if (
            key === "Enter" ||
            key === "="
        ) {

            event.preventDefault();

            calculateResult();

            return;
        }


        /*
           Backspace
        */

        if (
            key === "Backspace"
        ) {

            event.preventDefault();

            backspaceBtn.click();

            return;
        }


        /*
           Escape = Clear
        */

        if (
            key === "Escape"
        ) {

            event.preventDefault();

            clearBtn.click();
        }

    }
);


/* ======================================================
   SAFE HTML FOR HISTORY
====================================================== */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* ======================================================
   START APPLICATION
====================================================== */

renderHistory();

updateDisplay();

setStatus("Ready");