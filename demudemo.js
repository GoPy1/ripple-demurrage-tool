// demurrage_demo.js - demonstrate 2-way demurrage/interest conversions
// Requires: jQuery, ripple-lib

var ADDRESS_ONE = "rrrrrrrrrrrrrrrrrrrrBZbvji";
var Amount = ripple.Amount;
var Currency = ripple.Currency;

$(document).ready(function() {
    //bind events
    $("#to_display").click(calc_to_display);
    $("#to_ledger").click(calc_to_ledger);
    $("#time_to_now_1").click(time_to_now);
    $("#cur_1").change(gen_curcode);
    $("#rate_1").change(gen_curcode);
    $("#hex_1").change(parse_curcode);
    
    //fill in some stuff on page load
    gen_curcode();
    time_to_now();
    calc_to_display();
});

function calc_to_display() {
    ref_time = get_ref_time();
    curcode = gen_curcode();
    ledger_amount = get_ledger_amount();
    
    demAmount = Amount.from_json(ledger_amount+"/"+curcode+"/"+ADDRESS_ONE);
    demAmount = demAmount.applyInterest(ref_time);
    
    if (demAmount === undefined ) {
        alert("Error: ripple-lib failed to calculate interest. Maybe not a valid date?");
    }
    
    set_display_amount(demAmount.to_json().value);
}

function calc_to_ledger() {
    var ref_time = get_ref_time();
    var curcode = gen_curcode();
    var display_value = get_display_amount();
    
    ledgAmount =Amount.from_human(display_value+" "+curcode, {reference_date:ref_time});
    //ledgAmount.set_issuer(ADDRESS_ONE);//this step seems unnecessary
    
    set_ledger_amount(ledgAmount.to_json().value);
}


function gen_curcode() {
    threeletters = $("#cur_1").val();
    rate = $("#rate_1").val();
    
    //Workaround RLJS-188
    if (rate.indexOf(".") == -1) {
        rate = rate.concat(".0");
    }
    
    var c = Currency.from_json(threeletters+" ("+rate+"%pa)");
    
    if (c.is_valid()) {
        if (c.is_native()) {
            alert("Error: XRP cannot have interest or demurrage.");
            return false;
        } else {
            $("#hex_1").val(c.to_hex());
            $("#ledger_cur_1").text(c.to_json());
            return c.to_hex();
        }
    } else {
        $("#hex_1").val("(Invalid currency/rate)");
        return false;
    }
}

function parse_curcode() {
    hex = $("#hex_1").val();
    
    var c = Currency.from_hex(hex);
    
    if (c.is_valid()) {
        if (c.is_native()) {
            alert("Error: XRP cannot have interest or demurrage.");
            return false;
        } else {
            threeletters = c.get_iso();
            $("#cur_1").val(threeletters);
            
            //Convert rate to percentage
            rate = (c.get_interest_at(0) -1) * 100;
            $("#rate_1").val(rate);
            
            //some currencies' to_human() output is still hex
            //if so, they won't have a space
            if (c.to_human().indexOf(" ") != -1) {
                $("#ledger_cur_1").text(c.to_json());
            } else {
                $("#ledger_cur_1").text("Unknown currency format");
            }
        }
    } else {
        alert("Invalid hex code for currency");
        return false;
    }
}

function get_ledger_amount() {
    var ledger_val = $("#ledger_val_1").val();
    var test = Amount.from_json(ledger_val+"/2/1");
    if (!test.is_valid()) {
        alert("Error: Invalid ledger value");
    }
    return test.to_text();//normalized string
}

function set_ledger_amount(value) {
    $("#ledger_val_1").val(value);
}

function get_display_amount() {
    var display_val = $("#display_val_1").val();
    var test = Amount.from_json(display_val+"/2/1");
    if (!test.is_valid()) {
        alert("Error: Invalid display value");
    }
    return test.to_text();
}

function set_display_amount(value) {
    $("#display_val_1").val(value);
}

function get_ref_time() {
    t_string = $("#display_datetime_1").val();
    t_date = new Date(t_string);
    
    if (t_date === undefined) {
        alert("Error: invalid reference time");
    }
    
    return t_date;
}

function time_to_now() {
    t = new Date();
    t.setMilliseconds(0);//Truncate ms to match Ripple convention
    $("#display_datetime_1").val( t.toISOString() );
}

