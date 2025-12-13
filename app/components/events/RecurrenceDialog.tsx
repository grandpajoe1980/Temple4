"use client";

import React, { useState, useEffect } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import { RRule, Frequency } from "rrule";

interface RecurrenceDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (rule: string | null) => void;
    initialRule?: string | null;
    startDate: Date;
}

export default function RecurrenceDialog({
    isOpen,
    onClose,
    onSave,
    initialRule,
    startDate,
}: RecurrenceDialogProps) {
    const [frequency, setFrequency] = useState<Frequency>(RRule.WEEKLY);
    const [interval, setInterval] = useState(1);
    const [endType, setEndType] = useState<"NEVER" | "COUNT" | "UNTIL">("NEVER");
    const [count, setCount] = useState(1);
    const [until, setUntil] = useState("");
    const [byWeekDay, setByWeekDay] = useState<number[]>([]);

    // Initialize from existing rule or defaults
    useEffect(() => {
        if (isOpen) {
            if (initialRule) {
                try {
                    const rule = RRule.fromString(initialRule);
                    setFrequency(rule.options.freq);
                    setInterval(rule.options.interval);

                    if (rule.options.count) {
                        setEndType("COUNT");
                        setCount(rule.options.count);
                    } else if (rule.options.until) {
                        setEndType("UNTIL");
                        setUntil(rule.options.until.toISOString().split("T")[0]);
                    } else {
                        setEndType("NEVER");
                    }

                    if (rule.options.byweekday) {
                        // rrule stores byweekday as objects or integers depending on version/usage
                        // safely extract distinct days.
                        const days = Array.isArray(rule.options.byweekday)
                            ? rule.options.byweekday.map((d: any) => typeof d === 'number' ? d : d.weekday)
                            : [];
                        setByWeekDay(days);
                    } else {
                        setByWeekDay([]);
                    }
                } catch (e) {
                    console.error("Failed to parse rule", e);
                }
            } else {
                // Defaults
                setFrequency(RRule.WEEKLY);
                setInterval(1);
                setEndType("NEVER");
                setCount(10);
                setUntil("");
                setByWeekDay([]);
            }
        }
    }, [isOpen, initialRule]);

    const handleSave = () => {
        try {
            const options: any = {
                freq: frequency,
                interval,
                dtstart: startDate,
            };

            if (endType === "COUNT") {
                options.count = count;
            } else if (endType === "UNTIL" && until) {
                options.until = new Date(until);
            }

            if (frequency === RRule.WEEKLY && byWeekDay.length > 0) {
                options.byweekday = byWeekDay;
            }

            const rule = new RRule(options);
            // We start the rule string without DTSTART, as that's often redundant/handled by the event start time, 
            // but RRule.toString() includes it by default if provided. 
            // For storage, usually just the RRULE part is enough if we trust the event start date.
            // However, usually it returns "RRULE:FREQ=..."
            onSave(rule.toString());
            onClose();
        } catch (e) {
            alert("Invalid recurrence settings");
        }
    };

    const toggleDay = (day: number) => {
        if (byWeekDay.includes(day)) {
            setByWeekDay(byWeekDay.filter((d) => d !== day));
        } else {
            setByWeekDay([...byWeekDay, day]);
        }
    };

    // 0 = MO, 1 = TU, ... 6 = SU in RRule (actually RRule.MO is a weekday object, but mapped to int 0-6)
    // RRule.JS: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
    const DAYS = [
        { label: "Mo", val: 0 },
        { label: "Tu", val: 1 },
        { label: "We", val: 2 },
        { label: "Th", val: 3 },
        { label: "Fr", val: 4 },
        { label: "Sa", val: 5 },
        { label: "Su", val: 6 },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Repeat Event">
            <div className="space-y-6">
                {/* Frequency */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frequency
                    </label>
                    <select
                        value={frequency}
                        onChange={(e) => setFrequency(parseInt(e.target.value))}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-[color:var(--primary)]"
                    >
                        <option value={RRule.DAILY}>Daily</option>
                        <option value={RRule.WEEKLY}>Weekly</option>
                        <option value={RRule.MONTHLY}>Monthly</option>
                        <option value={RRule.YEARLY}>Yearly</option>
                    </select>
                </div>

                {/* Interval */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Every</span>
                    <Input
                        type="number"
                        min={1}
                        value={interval}
                        onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                        className="w-20"
                    />
                    <span className="text-sm text-gray-700">
                        {frequency === RRule.DAILY && "day(s)"}
                        {frequency === RRule.WEEKLY && "week(s)"}
                        {frequency === RRule.MONTHLY && "month(s)"}
                        {frequency === RRule.YEARLY && "year(s)"}
                    </span>
                </div>

                {/* Weekly specific options */}
                {frequency === RRule.WEEKLY && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            On days
                        </label>
                        <div className="flex gap-2">
                            {DAYS.map((d) => (
                                <button
                                    key={d.val}
                                    type="button"
                                    onClick={() => toggleDay(d.val)}
                                    className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${byWeekDay.includes(d.val)
                                        ? "bg-indigo-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    {d.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* End condition */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ends
                    </label>
                    <div className="space-y-3">
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="endType"
                                value="NEVER"
                                checked={endType === "NEVER"}
                                onChange={() => setEndType("NEVER")}
                                className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">Never</span>
                        </label>

                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="endType"
                                value="COUNT"
                                checked={endType === "COUNT"}
                                onChange={() => setEndType("COUNT")}
                                className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">After</span>
                            <input
                                type="number"
                                min={1}
                                value={count}
                                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                                disabled={endType !== "COUNT"}
                                className="w-20 rounded-md border border-gray-300 py-1 px-2 text-sm disabled:bg-gray-100"
                            />
                            <span className="text-sm text-gray-700">occurrences</span>
                        </label>

                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="endType"
                                value="UNTIL"
                                checked={endType === "UNTIL"}
                                onChange={() => setEndType("UNTIL")}
                                className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">On</span>
                            <input
                                type="date"
                                value={until}
                                onChange={(e) => setUntil(e.target.value)}
                                disabled={endType !== "UNTIL"}
                                className="rounded-md border border-gray-300 py-1 px-2 text-sm disabled:bg-gray-100"
                            />
                        </label>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        Set Recurrence
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
