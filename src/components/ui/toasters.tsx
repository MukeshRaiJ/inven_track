import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { useToast } from "@/components/ui/toaster";

// A simple component to test the toast functionality
const ToastTestComponent = () => {
  const { toast } = useToast();

  const handleClick = () => {
    toast({
      title: "Test Toast",
      description: "This is a test toast notification",
    });
  };

  return <button onClick={handleClick}>Show Toast</button>;
};

describe("useToast Hook", () => {
  it("should render a toast when invoked", () => {
    const { getByText } = render(<ToastTestComponent />);
    const button = getByText("Show Toast");

    // Simulate a button click
    fireEvent.click(button);

    // Assert the toast is rendered
    expect(getByText("Test Toast")).toBeInTheDocument();
    expect(getByText("This is a test toast notification")).toBeInTheDocument();
  });
});
